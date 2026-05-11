# arch think — Design Spec

**Date:** 2026-05-11
**Scope:** ARCH — Phase 1: Friction Reduction — Intent promotion engine
**Status:** Approved
**Supersedes:** Parts of `2026-05-07-arch-capture-design.md` — THINK Phase 1 protocol and task draft mechanics.

---

## Summary

This spec defines the implementation of `arch think`: the command that promotes captured intents into actionable TASK drafts. It also adds pipe support to `arch capture` and introduces the `DRAFT` task status.

The architecture is a strict three-layer pipeline:

```
capture (ingest)  →  think (promote)  →  human (approve)
```

- `capture` = deterministic signal ingestion. Never interprets.
- `think` = scaffold + cognitive enrichment. TASK is actionable only once `enrichment_phase == finalized`.
- `human` = sets READY. The only gate that legitimizes execution.

---

## Delta: `arch capture` — pipe support

One addition only:

```bash
arch capture "fix login flow"          # existing — unchanged
echo "fix login flow" | arch capture   # new — pipe fallback
cat notes.md | arch capture            # multiline allowed
```

**Resolution rule (strict priority):**
1. If argv has content → use argv
2. Else if stdin is piped (non-TTY) → read stdin
3. Else → hard error

```
Error: capture text required
Usage:
  arch capture "text"
  echo "text" | arch capture
```

**Invariants:**
- If both argv and stdin present: argv wins. Optional warning: `stdin ignored — explicit argument provided`.
- Input trimmed. Empty or whitespace-only after trim → hard error.
- Multiline stdin is valid. THINK decides what it means.
- Target latency: <1 second.

---

## New command: `arch think`

### Invocation

```bash
arch think              # process all CAPTURED intents + apply all pending patches
arch think INTENT-104  # process one specific intent + apply its pending patch
```

`arch think` is idempotent and stateless from the caller's perspective. Behavior is determined entirely by what is on disk. Run it twice — same outcome.

### Pipeline state machine

`enrichment_phase` is the **single source of pipeline truth**. There is no secondary status field.

```
                                     (agent session)
INTENT: CAPTURED                      ┌─────────────────────────────────────┐
    │                                 │  reads scaffold                     │
    ▼                                 │  writes .arch/pending/TASK-patch    │
arch think → enrichment_phase: scaffolded                                   │
    │                                 │  writes .arch/pending/INTENT-trans  │
    │                                 └─────────────────────────────────────┘
    ▼
arch think → enrichment_phase: enriching  (patch detected, apply begins)
    │
    ▼  FinalizePromotion (all-or-nothing)
    │
enrichment_phase: finalized
INTENT: PROMOTED
.arch/pending → empty
```

**Phase definitions:**

| `enrichment_phase` | Meaning |
|--------------------|---------|
| `scaffolded` | CLI scaffold written; awaiting agent patch |
| `enriching` | Patch detected; `FinalizePromotion` in progress (transient — not persisted on success) |
| `enriched` | Patch applied; INTENT not yet promoted (only set if `FinalizePromotion` partially fails — see Failure) |
| `finalized` | All-or-nothing apply complete; INTENT promoted; snapshot written |
| `failed` | Unrecoverable error during finalization; audit record preserved |

**A TASK is actionable only when `enrichment_phase == finalized`.**

`arch review`, `arch next`, and `arch exec` treat every other phase as invisible.

### Ownership model

The agent NEVER writes TASK or INTENT files directly. It only writes to `.arch/pending/`. The CLI is the sole writer of all final state.

| Artifact | Writer | Mechanism |
|----------|--------|-----------|
| `docs/intents/INTENT-XXX.md` | CLI only | `FinalizePromotion` use case |
| `docs/tasks/TASK-XXX.md` (scaffold + generation) | CLI only | `arch think` Phase 1 |
| `docs/tasks/TASK-XXX.md` (enrichment sections) | CLI only | `FinalizePromotion` use case (from patch) |
| `.arch/pending/TASK-XXX-patch.json` | Agent only | Agent's sole output mechanism |
| `.arch/pending/INTENT-XXX-transition.json` | Agent only | Agent's intent transition request |
| `.arch/enrichments/TASK-XXX.json` | CLI only | `FinalizePromotion` use case |

No concurrent writers. No locking needed. State transitions are sequential and traceable.

---

## Phase 1 — Scaffold (CLI, deterministic)

For each CAPTURED intent:

1. Assert promotion safety (see Safety Invariants).
2. Allocate TASK-ID from `MarkdownTaskRepository`.
3. Run `ContextInference.score()` on raw intent text.
4. Write `docs/tasks/TASK-XXX.md` with `enrichment_phase: scaffolded`.
5. Print:

```
Scaffold created: TASK-212 ← INTENT-104
enrichment_phase: scaffolded
Agent: enrich TASK-212, then write patches to .arch/pending/
```

---

## Phase 2 — Agent enrichment (structured output only, no file writes)

The THINK agent reads the scaffolded TASK file and produces two files in `.arch/pending/`.

### TASK_PATCH: `.arch/pending/TASK-XXX-patch.json`

```json
{
  "task_id": "TASK-212",
  "schema_version": 1,
  "produced_at": "2026-05-11T10:30:00Z",
  "actor": {
    "name": "think-agent",
    "model": "claude-sonnet-4-6",
    "version": "v1"
  },
  "fields": {
    "title": "Fix OAuth callback session loss",
    "meta": {
      "priority": "P1",
      "size": "M",
      "class": "2-code-generation",
      "cli": "cli/src/main/ts/..."
    },
    "objective": "...",
    "acceptance_criteria": ["...", "..."],
    "complexity": "M",
    "complexity_reasoning": "...",
    "confidence": "medium",
    "confidence_reasoning": "...",
    "risks": ["..."],
    "depends": []
  }
}
```

### Intent transition request: `.arch/pending/INTENT-XXX-transition.json`

```json
{
  "intent_id": "INTENT-104",
  "task_id": "TASK-212",
  "schema_version": 1,
  "produced_at": "2026-05-11T10:30:00Z",
  "action": "promote",
  "promotion_confidence": "medium"
}
```

**The agent produces data. The CLI acts on it. No CLI commands are executed by the agent for state transitions.**

---

## Phase 3 — Finalize (CLI, single transactional use case)

`arch think` detects a valid pending pair in `.arch/pending/` and calls `FinalizePromotion`.

### `FinalizePromotion` use case

All-or-nothing semantic. No visible intermediate committed state.

**Preconditions (abort if violated):**
- Patch schema valid
- TASK `enrichment_phase == scaffolded`
- INTENT `status == CAPTURED`
- No existing enrichment snapshot

**Operations (executed as a single unit):**
1. Write agent-owned sections to `docs/tasks/TASK-XXX.md`
2. Update `docs/tasks/TASK-XXX.md` Generation block: `enriched_by`, `enrichment_phase: finalized`
3. Update `docs/intents/INTENT-XXX.md`: `status: PROMOTED`, `promoted_to`, `promotion_confidence`
4. Write enrichment snapshot to `.arch/enrichments/TASK-XXX.json`
5. Delete `.arch/pending/TASK-XXX-patch.json`
6. Delete `.arch/pending/INTENT-XXX-transition.json`

**On success:** `.arch/pending/` is empty. All state is consistent.

**On failure (any step):**
- No partial state is committed to git
- `enrichment_phase` is set to `failed` in the TASK file
- Error is written to `.arch/enrichments/TASK-XXX-error.json` for audit
- Pending files are deleted (not left as garbage)
- INTENT remains `CAPTURED`
- `.arch/pending/` is empty after failure

**Invariant: `.arch/pending/` must be empty after every `arch think` execution, success or failure.**

5. Print on success:

```
TASK-212 promoted to DRAFT ← INTENT-104
enrichment_phase: finalized
Ready for human review
```

---

## TASK file format for DRAFT

CLI-owned sections are written only by CLI. Agent-owned sections are written only by `FinalizePromotion` (from the TASK_PATCH). No section is written by two different paths.

```markdown
## TASK-XXX: <!-- agent-owned: title -->

**Meta:** <!-- agent-owned: priority | size --> | DRAFT | Focus:no | <!-- agent-owned: class | cli -->
**Source:** INTENT-XXX  <!-- cli-owned -->
**Depends:** <!-- agent-owned -->

### Generation  <!-- cli-owned: entire section -->

enrichment_phase: scaffolded
scaffolded_by: arch-cli
scaffolded_at: 2026-05-11T10:00:00Z
enriched_by:
  actor: ~
  model: ~
  version: ~

### Objective  <!-- agent-owned -->

### Acceptance Criteria  <!-- agent-owned -->

- [ ] ...

### Complexity  <!-- agent-owned -->

### Confidence  <!-- agent-owned -->

### Relevant Context  <!-- cli-owned: entire section -->

_Pre-filled by ContextInference — confidence: 0.72_

**Files:**
...

**ADRs:**
...

**Similar Tasks:**
...

### Risks  <!-- agent-owned -->
```

---

## Use case summary

| Use Case | Responsibility | Writes |
|----------|---------------|--------|
| `CaptureIntent` | Save raw intent | `docs/intents/` |
| `BuildIndex` | Compile context index | `.arch/context-index.json` |
| `ContextInference` | Score relevance for task text | (pure computation) |
| `FinalizePromotion` | All-or-nothing: apply patch + promote INTENT + record audit | `docs/tasks/`, `docs/intents/`, `.arch/enrichments/` |

`FinalizePromotion` subsumes what were previously `ApplyPatch`, `PromoteIntent`, and `RecordEnrichment`. They are now internal steps, not separate use cases.

---

## Task status changes

### New status: `DRAFT`

```
DRAFT → READY → IN_PROGRESS → REVIEW → DONE
     ↘ REJECTED
```

| Status | Meaning |
|--------|---------|
| `DRAFT` | Created by THINK. Actionable only at `enrichment_phase == finalized`. |
| `READY` | Human approved. Available for execution. |
| `IN_PROGRESS` | Actively being worked. |
| `REVIEW` | Work complete, in review. |
| `DONE` | Verified and closed. |
| `REJECTED` | Will not be done. |

### `BACKLOG` deprecated

Retained in enum for backward compatibility. No new tasks will use it. `arch think` never emits it.

---

## Enrichment snapshot (`.arch/enrichments/TASK-XXX.json`)

Written by `FinalizePromotion` at the end of successful finalization. Immutable after creation.

```json
{
  "task_id": "TASK-212",
  "intent_id": "INTENT-104",
  "finalized_at": "2026-05-11T10:30:00Z",
  "actor": {
    "name": "think-agent",
    "model": "claude-sonnet-4-6",
    "version": "v1"
  },
  "fields": {
    "title": "...",
    "objective": "...",
    "acceptance_criteria": ["...", "..."],
    "complexity": "M",
    "confidence": "medium",
    "risks": ["..."]
  }
}
```

On failure: `.arch/enrichments/TASK-XXX-error.json` is written instead with error details and the patch that failed. Enables debugging and retry without information loss.

---

## Safety invariants

| Invariant | Rule |
|-----------|------|
| Only CAPTURED intents are promotable | `INTENT.status != CAPTURED` → abort |
| Promotion is single-shot | `INTENT.promoted_to` not empty → abort |
| No task overwrite | `docs/tasks/TASK-XXX.md` exists → abort at scaffold phase |
| No patch overwrite | Pending patch exists for same TASK → warn and skip |
| INTENT written only by FinalizePromotion | Enforced by architecture — no other code path writes INTENT status |
| No partial promotion | INTENT marked PROMOTED only after all FinalizePromotion steps complete |
| Patch pair required | Both TASK patch and INTENT transition required; orphan files rejected and cleaned up |
| `.arch/pending/` always empty after execution | Invariant holds on success and failure |
| Failure preserves error record | `enrichment_phase: failed` + `.arch/enrichments/TASK-XXX-error.json` |
| Multi-intent isolation | One failure does not abort remaining intent processing |

---

## Testing

- `arch capture` pipe support: stdin path, multiline input, trim + empty rejection, argv-wins
- `FinalizePromotion` happy path: all artifacts written, pending cleaned up, TASK/INTENT consistent
- `FinalizePromotion` failure path: `enrichment_phase: failed`, error record written, pending cleared, INTENT unchanged
- Safety invariants: non-CAPTURED intent rejected, double-promotion rejected, orphan patch rejected
- `arch think` idempotency: running twice produces same outcome
- `enrichment_phase` progression: scaffolded → finalized (happy), scaffolded → failed (error)
- `TaskStatus.DRAFT` parsed and serialized by `MarkdownTaskRepository`
- Integration: full pipeline INTENT(CAPTURED) → scaffold → agent patches → finalized DRAFT + INTENT(PROMOTED)

---

## Out of scope

- Interactive stdin for `arch capture`
- Agent executing CLI commands for state transitions (by design: forbidden)
- Automatic DRAFT → READY (always human)
- Clustering or deduplication of intents
- Multi-intent merging into a single task
- Enrichment replay tooling (future)
