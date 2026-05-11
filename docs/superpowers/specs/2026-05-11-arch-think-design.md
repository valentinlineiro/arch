# arch think — Design Spec

**Date:** 2026-05-11
**Scope:** ARCH — Phase 1: Friction Reduction — Intent promotion engine
**Status:** Approved
**Supersedes:** Parts of `2026-05-07-arch-capture-design.md` — specifically the THINK Phase 1 protocol and task draft mechanics.

---

## Summary

This spec defines the implementation of `arch think`: the command that promotes captured intents into actionable TASK drafts. It also adds pipe support to `arch capture` and introduces the `DRAFT` task status.

The architecture is a strict three-layer pipeline:

```
capture (ingest)  →  think (promote)  →  human (approve)
```

- `capture` = deterministic signal ingestion. Never interprets.
- `think` = scaffold + cognitive enrichment. Always completes before done.
- `human` = sets READY. The only gate that legitimizes execution.

---

## Delta: `arch capture` — pipe support

`arch capture` already works. One addition only:

```bash
arch capture "fix login flow"          # existing — unchanged
echo "fix login flow" | arch capture   # new — pipe fallback
cat notes.md | arch capture            # multiline allowed
```

**Resolution rule:**
1. If argv has content → use argv
2. Else if stdin is piped (non-TTY) → read stdin
3. Else → error

```
Error: capture text required
Usage:
  arch capture "text"
  echo "text" | arch capture
```

**Invariants:**
- If both argv and stdin are present: argv wins. Optional warning: `stdin ignored — explicit argument provided`.
- Input is trimmed. Empty or whitespace-only input after trim → hard error. No semantic garbage.
- Multiline stdin is valid. THINK decides what it means.
- Target latency: <1 second, no exceptions.

---

## New command: `arch think`

### Invocation

```bash
arch think              # process all CAPTURED intents
arch think INTENT-104  # process one specific intent
```

Primary operator: THINK agent running in THINK mode.
Secondary operator: human (direct invocation supported — no restriction).

### Conceptual contract

`arch think` is a single atomic operation. It ends only when a complete, enriched TASK DRAFT exists. There is no intermediate state visible to the caller.

Internally it has three phases, but those are implementation detail — not protocol.

### Phase 1 — Deterministic scaffold (CLI)

For each CAPTURED intent being processed:

1. Assert promotion safety (see Safety Invariants).
2. Allocate next TASK-ID from `MarkdownTaskRepository`.
3. Run `ContextInference.score()` on the raw intent text.
4. Write `docs/tasks/TASK-XXX.md` with:
   - `status: DRAFT`
   - `source: INTENT-XXX`
   - `generation` block (see below)
   - Context section pre-filled from ContextInference: scored files, ADRs, guidelines, similar tasks
   - Structural sections with explicit agent targets: Objective, Acceptance Criteria, complexity, confidence, risks
5. Print to stdout:

```
Scaffold created: TASK-212
Awaiting THINK enrichment...
```

The task file at this point is structurally complete but cognitively incomplete. The agent must enrich it before the operation is considered done.

### Phase 2 — Cognitive enrichment (agent)

The THINK agent reads the scaffolded file and fills in all agent-owned sections:

- Title (in the `## TASK-XXX:` heading)
- Meta fields: priority, size, class, cli path
- `### Objective` — 1-2 sentence framing
- `### Acceptance Criteria` — draft, concrete, testable ACs
- `complexity` — XS / S / M / L / XL with brief reasoning
- `confidence` — low / medium / high with brief reasoning
- `### Risks` — edge cases, regressions, systemic concerns

After enrichment, the agent updates the `generation` block:
- `enriched_by.actor`, `enriched_by.model`, `enriched_by.version`
- `enrichment_status: success`

**Enrichment is mandatory.** An unenriched scaffold is not a completed operation.

### Phase 3 — Finalize (agent, inline)

After enrichment, the agent:

1. Updates `docs/intents/INTENT-XXX.md`:
   - `status: PROMOTED`
   - `promoted_to: [TASK-XXX]`
   - `promotion_confidence: low | medium | high`
2. Prints final output:

```
TASK-212 promoted to DRAFT
Ready for human review
```

No separate CLI command. The agent writes both files directly as part of the same `arch think` session.

---

## TASK file format for DRAFT

```markdown
## TASK-XXX: <title — agent fills>

**Meta:** P? | ? | DRAFT | Focus:no | ? | claude-code | ?
**Source:** INTENT-XXX
**Depends:** none

### Generation

```yaml
scaffolded_by: arch-cli
enriched_by:
  actor: think-agent
  model: claude-sonnet-4-6
  version: v1
generated_at: 2026-05-11T10:00:00Z
enrichment_status: pending   # pending | success | failed
enrichment_error: ~
```

### Objective

<!-- agent: 1-2 sentences framing what must be achieved -->

### Acceptance Criteria

<!-- agent: draft concrete, testable ACs -->
- [ ] ...

### Complexity

<!-- agent: XS/S/M/L/XL — include brief reasoning -->

### Confidence

<!-- agent: low / medium / high — include brief reasoning -->

### Relevant Context

_Pre-filled by ContextInference_

**Files:**
- cli/src/main/ts/... _(core)_

**ADRs:**
- ADR-XXX: ... _(enforced)_

**Guidelines:**
- ...

**Similar Tasks:**
- TASK-XXX (commitCount: N, lastCommitDate: YYYY-MM-DD)

### Risks

<!-- agent: suspected regressions, edge cases, systemic concerns -->
```

**Agent-owned fields:** title, Meta priority/size/class/path, Objective, ACs, Complexity, Confidence, Risks, enriched_by, enrichment_status.

**CLI-owned fields:** Source, generated_at, scaffolded_by, Relevant Context section.

---

## Task status changes

### New status: `DRAFT`

Added to `TaskStatus` enum. Sits before `READY` in the lifecycle.

```
DRAFT → READY → IN_PROGRESS → REVIEW → DONE
     ↘ REJECTED
```

| Status | Meaning |
|--------|---------|
| `DRAFT` | Created by THINK. Awaiting human review. Not executable. |
| `READY` | Human approved. Available for execution. |
| `IN_PROGRESS` | Actively being worked. |
| `REVIEW` | Work complete, in review. |
| `DONE` | Verified and closed. |
| `REJECTED` | Will not be done. |

### `BACKLOG` deprecated

`BACKLOG` is kept in the enum for backward compatibility with existing task files. No new tasks will be created with `BACKLOG` status. `arch think` never emits `BACKLOG`. The status is considered deprecated.

---

## Generation metadata

Embedded in each THINK-generated task file under `### Generation`:

```yaml
scaffolded_by: arch-cli
enriched_by:
  actor: think-agent
  model: <model-id>
  version: <think-version>
generated_at: <ISO-8601>
enrichment_status: pending | success | failed
enrichment_error: <message if failed, null otherwise>
```

**Purpose:** Auditability. When a draft is poor, you can identify who produced what. Model and version allow future replay or quality analysis.

**Failure handling:** If enrichment fails mid-session, `enrichment_status: failed` and `enrichment_error` are set. `TaskStatus` stays `DRAFT`. The INTENT is NOT marked PROMOTED. The scaffold persists as an audit trail. The operator retries.

---

## Safety invariants

These are hard rules. No exceptions.

| Invariant | Rule |
|-----------|------|
| Only CAPTURED intents are promotable | If `INTENT.status != CAPTURED` → abort with message |
| Promotion is single-shot | If INTENT already has `promoted_to` entries → abort |
| No task overwrite | If `docs/tasks/TASK-XXX.md` already exists → abort |
| No partial promotion | INTENT is only marked PROMOTED after successful enrichment |
| Failure preserves audit trail | Failed enrichment leaves scaffold in place with `enrichment_status: failed` |

**Multi-intent failure isolation:** When `arch think` processes multiple intents and one fails, processing continues for the remaining intents. Each intent is processed independently. Failures are reported per-intent, not as a batch abort.

**Abort messages are explicit:**

```
Error: INTENT-104 is already PROMOTED (promoted_to: TASK-212)
       Use arch think INTENT-XXX only on CAPTURED intents.

Error: TASK-212 already exists. Refusing to overwrite.
       Something is wrong — investigate before retrying.
```

---

## Testing

- `arch capture` pipe support: unit test stdin path, multiline input, trim + empty rejection, argv-wins-over-stdin
- `PromoteIntent` use case: safety invariants (all five), context pre-fill from mock ContextInference, scaffold structure conformance, generation metadata population
- Integration: full `arch think INTENT-XXX` → TASK-XXX scaffold written → INTENT unchanged (pending enrichment)
- `TaskStatus.DRAFT` parsed and serialized correctly by `MarkdownTaskRepository`

---

## Out of scope

- Interactive stdin (`arch capture` prompt mode)
- `arch think --ai` or any flag that routes directly to a model
- Automatic status transition from DRAFT → READY (always human)
- `arch think finalize` as a public command
- Clustering or deduplication of similar intents
- Multi-intent merging into a single task
