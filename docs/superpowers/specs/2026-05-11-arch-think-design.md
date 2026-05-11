# arch think — Design Spec

**Date:** 2026-05-11
**Scope:** ARCH — Phase 1: Friction Reduction — Intent promotion engine
**Status:** Approved
**Supersedes:** Parts of `2026-05-07-arch-capture-design.md` — specifically THINK Phase 1 protocol and task draft mechanics.

---

## Summary

This spec defines the implementation of `arch think`: the command that promotes captured intents into actionable TASK drafts. It also adds pipe support to `arch capture` and introduces the `DRAFT` task status.

The architecture is a strict three-layer pipeline:

```
capture (ingest)  →  think (promote)  →  human (approve)
```

- `capture` = deterministic signal ingestion. Never interprets.
- `think` = scaffold + cognitive enrichment. TASK is only actionable once `enrichment_status == success`.
- `human` = sets READY. The only gate that legitimizes execution.

---

## Delta: `arch capture` — pipe support

`arch capture` already works. One addition only:

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
- Input is trimmed. Empty or whitespace-only after trim → hard error. No semantic garbage.
- Multiline stdin is valid. THINK decides what it means.
- Target latency: <1 second.

---

## New command: `arch think`

### Invocation

```bash
arch think              # process all CAPTURED intents
arch think INTENT-104  # process one specific intent
```

Primary operator: THINK agent running in THINK mode.
Secondary operator: human (direct invocation supported).

### Pipeline state machine

`generation.enrichment_status` is the single source of operational truth. The pipeline state is always recoverable by reading this field.

```
INTENT.status = CAPTURED
  │
  ▼
arch think → TASK created, enrichment_status = pending
  │
  ▼  (agent enriches TASK file — bounded sections only)
  │
  ▼
arch intent promote → enrichment_status = success, INTENT.status = PROMOTED
```

**A TASK is actionable only when `enrichment_status == success`.**
A task with `enrichment_status == pending` or `failed` is not ready for human review — it is mid-pipeline.

`arch review`, `arch next`, and `arch exec` must treat DRAFT tasks with non-`success` enrichment status as invisible.

### Phase 1 — Scaffold (CLI, deterministic)

For each CAPTURED intent being processed:

1. Assert promotion safety (see Safety Invariants).
2. Allocate next TASK-ID from `MarkdownTaskRepository`.
3. Run `ContextInference.score()` on the raw intent text.
4. Write `docs/tasks/TASK-XXX.md` with:
   - `status: DRAFT`
   - `source: INTENT-XXX`
   - `generation` block with `enrichment_status: pending`
   - `### Relevant Context` section pre-filled from ContextInference
   - Agent-owned sections with explicit markers (see TASK format)
5. Print:

```
Scaffold created: TASK-212
source: INTENT-104
Awaiting enrichment — run arch intent promote after completing TASK-212
```

### Phase 2 — Enrichment (agent, bounded write)

The THINK agent reads the scaffolded file and fills in **only agent-owned sections**:

- Title (in the `## TASK-XXX:` heading)
- Meta fields: priority, size, class, cli path
- `### Objective`
- `### Acceptance Criteria`
- `### Complexity`
- `### Confidence`
- `### Risks`

The agent does NOT touch: `### Generation`, `### Relevant Context`, `source:`, `status:`.

Schema enforcement: agent-owned sections are marked with `<!-- agent-owned -->`. CLI-owned sections are marked `<!-- cli-owned -->`. Tooling can validate ownership boundaries.

### Phase 3 — Finalize (agent calls CLI use case)

After enrichment, the agent runs:

```bash
arch intent promote INTENT-104 TASK-212 --confidence medium
```

This invokes the `PromoteIntent` use case, which:
1. Validates `TASK-212` exists and `enrichment_status != success` (prevents double-promotion).
2. Sets `docs/tasks/TASK-212.md`: `generation.enriched_by`, `enrichment_status: success`.
3. Sets `docs/intents/INTENT-104.md`: `status: PROMOTED`, `promoted_to: [TASK-212]`, `promotion_confidence: medium`.
4. Serializes enrichment snapshot to `.arch/enrichments/TASK-212.json` for audit trail.
5. Prints:

```
TASK-212 promoted to DRAFT
Ready for human review
```

**INTENT is never written by the agent directly.** All INTENT mutations go through `PromoteIntent`. This is the single writer for INTENT state transitions.

---

## Ownership table

| Artifact | Writer | Mechanism |
|----------|--------|-----------|
| `docs/intents/INTENT-XXX.md` | CLI only | `PromoteIntent` use case |
| `docs/tasks/TASK-XXX.md` (scaffold) | CLI only | `arch think` Phase 1 |
| `docs/tasks/TASK-XXX.md` (enrichment sections) | Agent only | Direct write, bounded by schema markers |
| `docs/tasks/TASK-XXX.md` (generation block, final) | CLI only | `PromoteIntent` use case |
| `.arch/enrichments/TASK-XXX.json` | CLI only | `PromoteIntent` use case |

---

## TASK file format for DRAFT

```markdown
## TASK-XXX: <title — agent fills> <!-- agent-owned -->

**Meta:** P? | ? | DRAFT | Focus:no | ? | claude-code | ?  <!-- agent-owned -->
**Source:** INTENT-XXX  <!-- cli-owned -->
**Depends:** none  <!-- agent-owned -->

### Generation <!-- cli-owned -->

scaffolded_by: arch-cli
enriched_by:
  actor: ~
  model: ~
  version: ~
generated_at: 2026-05-11T10:00:00Z
enrichment_status: pending
enrichment_error: ~

### Objective <!-- agent-owned -->

<!-- Write 1-2 sentences framing what must be achieved -->

### Acceptance Criteria <!-- agent-owned -->

<!-- Draft concrete, testable ACs -->
- [ ] ...

### Complexity <!-- agent-owned -->

<!-- XS / S / M / L / XL — include brief reasoning -->

### Confidence <!-- agent-owned -->

<!-- low / medium / high — include brief reasoning -->

### Relevant Context <!-- cli-owned -->

_Pre-filled by ContextInference — confidence: 0.72_

**Files:**
- cli/src/main/ts/... _(core)_

**ADRs:**
- ADR-XXX: ... _(enforced)_

**Guidelines:**
- ...

**Similar Tasks:**
- TASK-XXX (commitCount: N, lastCommitDate: YYYY-MM-DD)

### Risks <!-- agent-owned -->

<!-- Suspected regressions, edge cases, systemic concerns -->
```

---

## New command: `arch intent promote`

```bash
arch intent promote INTENT-XXX TASK-XXX --confidence low|medium|high
```

Invokes `PromoteIntent` use case. Not a user-facing workflow ritual — it is an explicit operational command that the agent calls after enrichment. It may also be called by a human if enrichment was done manually.

**This command is NOT `arch think finalize`.** It is a standalone use case with clear semantics: "this intent has been promoted to this task."

---

## Task status changes

### New status: `DRAFT`

Added to `TaskStatus` enum.

```
DRAFT → READY → IN_PROGRESS → REVIEW → DONE
     ↘ REJECTED
```

| Status | Meaning |
|--------|---------|
| `DRAFT` | Created by THINK. Not actionable until `enrichment_status == success`. Awaiting human review after enrichment. |
| `READY` | Human approved. Available for execution. |
| `IN_PROGRESS` | Actively being worked. |
| `REVIEW` | Work complete, in review. |
| `DONE` | Verified and closed. |
| `REJECTED` | Will not be done. |

### `BACKLOG` deprecated

`BACKLOG` is retained in the enum for backward compatibility. No new tasks will be created with `BACKLOG`. `arch think` never emits `BACKLOG`. Considered deprecated.

---

## Generation metadata (CLI-owned)

Written by CLI into `### Generation` section. Never touched by agent directly.

```yaml
scaffolded_by: arch-cli
enriched_by:
  actor: think-agent        # set by PromoteIntent use case
  model: claude-sonnet-4-6  # set by PromoteIntent use case
  version: v1               # set by PromoteIntent use case
generated_at: <ISO-8601>
enrichment_status: pending | success | failed
enrichment_error: <message if failed, null otherwise>
```

`enriched_by` fields are passed as arguments to `arch intent promote` and written by the CLI, not harvested by the agent writing directly.

---

## Enrichment snapshot (`.arch/enrichments/TASK-XXX.json`)

Created by `PromoteIntent` use case at finalization. Contains a point-in-time snapshot of all agent-owned fields at the moment of promotion. Enables:
- Audit: what did the model produce?
- Replay: reproduce with same or different model
- Quality analysis: compare across model versions

```json
{
  "task_id": "TASK-212",
  "intent_id": "INTENT-104",
  "promoted_at": "2026-05-11T10:30:00Z",
  "enriched_by": { "actor": "think-agent", "model": "claude-sonnet-4-6", "version": "v1" },
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

---

## Safety invariants

| Invariant | Rule |
|-----------|------|
| Only CAPTURED intents are promotable | `INTENT.status != CAPTURED` → abort |
| Promotion is single-shot | `INTENT.promoted_to` not empty → abort |
| No task overwrite | `docs/tasks/TASK-XXX.md` already exists → abort |
| INTENT only written by PromoteIntent | Agent never writes INTENT files directly |
| No partial promotion | INTENT marked PROMOTED only after `enrichment_status` set to `success` |
| Failure preserves audit trail | Failed enrichment leaves scaffold with `enrichment_status: failed`; INTENT stays CAPTURED |
| Multi-intent failure isolation | When processing multiple intents, one failure does not abort the rest |

**Abort messages are explicit:**

```
Error: INTENT-104 is already PROMOTED (promoted_to: TASK-212)
       Only CAPTURED intents can be promoted.

Error: TASK-212 already exists. Refusing to overwrite.
       Something is wrong — investigate before retrying.

Error: Cannot promote INTENT-104 — enrichment_status is 'failed'.
       Fix enrichment before promoting.
```

---

## Testing

- `arch capture` pipe support: stdin path, multiline input, trim + empty rejection, argv-wins
- `PromoteIntent` use case: all five safety invariants, correct INTENT mutation, enrichment snapshot written
- `arch think`: scaffold structure conformance, ContextInference pre-fill, `enrichment_status: pending` on creation
- `arch intent promote`: INTENT status transition, `enrichment_status: success`, enrichment snapshot format
- `TaskStatus.DRAFT` parsed and serialized correctly by `MarkdownTaskRepository`
- Integration: full pipeline INTENT (CAPTURED) → scaffold → `arch intent promote` → DRAFT (success) → INTENT (PROMOTED)

---

## Out of scope

- Interactive stdin for `arch capture`
- `arch think --ai` or direct model flag
- Automatic DRAFT → READY transition (always human)
- Clustering or deduplication of similar intents
- Multi-intent merging into a single task
- Enrichment replay tooling (future)
