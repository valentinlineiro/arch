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

`arch think` is idempotent and stateless from the caller's perspective. Its behavior is determined entirely by what is already on disk. Run it twice — same outcome.

### Pipeline state machine

`enrichment_phase` is the single source of pipeline truth.

```
                                     (agent session)
INTENT: CAPTURED                      ┌─────────────────────────────────────┐
    │                                 │  reads scaffold                     │
    ▼                                 │  writes .arch/pending/TASK-patch    │
arch think → enrichment_phase: scaffolded                                   │
    │                                 │  writes .arch/pending/INTENT-trans  │
    │                                 └─────────────────────────────────────┘
    ▼
arch think → enrichment_phase: enriched   (patch + transition detected)
    │
    ▼ (CLI applies patch + runs PromoteIntent + RecordEnrichment)
    │
enrichment_phase: finalized
INTENT: PROMOTED
```

**Phase definitions:**

| `enrichment_phase` | Meaning |
|--------------------|---------|
| `scaffolded` | CLI scaffold written; awaiting agent enrichment |
| `enriched` | Agent patch received; CLI has not yet applied it |
| `finalized` | Patch applied, INTENT promoted, snapshot written |

**A TASK is actionable only when `enrichment_phase == finalized`.**

`arch review`, `arch next`, and `arch exec` treat all other phases as invisible.

### Ownership model

The agent NEVER writes TASK or INTENT files directly. It only writes to `.arch/pending/`. The CLI is the sole writer of all final state.

| Artifact | Writer | Mechanism |
|----------|--------|-----------|
| `docs/intents/INTENT-XXX.md` | CLI only | `PromoteIntent` use case |
| `docs/tasks/TASK-XXX.md` (scaffold + generation) | CLI only | `arch think` Phase 1 |
| `docs/tasks/TASK-XXX.md` (enrichment sections) | CLI only | `ApplyPatch` use case (from agent patch) |
| `.arch/pending/TASK-XXX-patch.json` | Agent only | Agent's sole output mechanism |
| `.arch/pending/INTENT-XXX-transition.json` | Agent only | Agent's intent transition request |
| `.arch/enrichments/TASK-XXX.json` | CLI only | `RecordEnrichment` use case |

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

## Phase 2 — Agent enrichment (produces structured output, no file writes)

The THINK agent reads the scaffolded TASK file and produces two files in `.arch/pending/`:

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

**The agent does not execute any CLI commands for state transitions.** It produces data. The CLI acts on it.

---

## Phase 3 — Apply (CLI, atomic)

`arch think` detects pending files in `.arch/pending/` and processes them.

For each valid `TASK-XXX-patch.json` + `INTENT-XXX-transition.json` pair:

1. **`ApplyPatch`** use case:
   - Validates patch schema and task state (`enrichment_phase == scaffolded`)
   - Writes agent-owned sections to `docs/tasks/TASK-XXX.md` atomically
   - Sets `enrichment_phase: enriched`
   - Sets `enriched_by` from patch actor metadata

2. **`PromoteIntent`** use case (domain state change):
   - Sets `INTENT.status = PROMOTED`
   - Sets `INTENT.promoted_to = [TASK-XXX]`
   - Sets `INTENT.promotion_confidence`
   - Sets TASK `enrichment_phase: finalized`

3. **`RecordEnrichment`** use case (audit):
   - Writes enrichment snapshot to `.arch/enrichments/TASK-XXX.json`
   - Snapshot captures all agent-owned fields at promotion time

4. Cleans up `.arch/pending/TASK-XXX-patch.json` and `.arch/pending/INTENT-XXX-transition.json`.

5. Prints:

```
TASK-212 promoted to DRAFT ← INTENT-104
enrichment_phase: finalized
Ready for human review
```

`PromoteIntent` and `RecordEnrichment` are separate use cases. They share no state. CLI orchestrates both — neither calls the other.

---

## TASK file format for DRAFT

CLI-owned sections are written by the CLI only. Agent-owned sections are written by `ApplyPatch` use case (from the TASK_PATCH).

```markdown
## TASK-XXX: <!-- agent-owned: title -->

**Meta:** <!-- agent-owned: priority | size --> | DRAFT | Focus:no | <!-- agent-owned: class | cli --> <!-- cli-owned: status and focus -->
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
enrichment_status: pending

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
| `ApplyPatch` | Apply agent TASK_PATCH to TASK file | `docs/tasks/TASK-XXX.md` (enrichment sections) |
| `PromoteIntent` | Domain state: INTENT → PROMOTED | `docs/intents/INTENT-XXX.md`, TASK `enrichment_phase: finalized` |
| `RecordEnrichment` | Audit snapshot | `.arch/enrichments/TASK-XXX.json` |

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

Written by `RecordEnrichment` at finalization. Immutable after creation.

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

Enables: audit, quality analysis, model comparison, replay.

---

## Safety invariants

| Invariant | Rule |
|-----------|------|
| Only CAPTURED intents are promotable | `INTENT.status != CAPTURED` → abort |
| Promotion is single-shot | `INTENT.promoted_to` not empty → abort |
| No task overwrite | `docs/tasks/TASK-XXX.md` exists → abort at scaffold phase |
| No patch overwrite | Pending patch exists → warn and skip (do not re-enrich) |
| INTENT written only by PromoteIntent | Enforced by architecture — no other code path writes INTENT status |
| No partial promotion | INTENT marked PROMOTED only after `enrichment_phase: finalized` |
| Patch pair required | Both TASK patch and INTENT transition must be present to apply |
| Failure preserves audit trail | Failed apply leaves scaffold + pending files intact; INTENT stays CAPTURED |
| Multi-intent isolation | One failure does not abort remaining intent processing |

---

## Testing

- `arch capture` pipe support: stdin path, multiline input, trim + empty rejection, argv-wins
- `ApplyPatch`: validates schema, writes only agent sections, rejects non-`scaffolded` tasks
- `PromoteIntent`: INTENT state transition, `enrichment_phase: finalized`, rejects already-promoted
- `RecordEnrichment`: snapshot format, immutable after creation
- `arch think`: full pipeline — scaffold → mock patch files → apply → finalized DRAFT + promoted INTENT
- `TaskStatus.DRAFT` parsed and serialized by `MarkdownTaskRepository`
- Integration: `enrichment_phase` progression through all four states

---

## Out of scope

- Interactive stdin for `arch capture`
- Agent executing CLI commands for state transitions (by design: forbidden)
- Automatic DRAFT → READY (always human)
- Clustering or deduplication of intents
- Multi-intent merging into a single task
- Enrichment replay tooling (future)
