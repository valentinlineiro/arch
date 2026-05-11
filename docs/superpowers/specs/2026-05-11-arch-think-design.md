# arch think — Design Spec

**Date:** 2026-05-11
**Scope:** ARCH — Phase 1: Friction Reduction — Intent promotion engine
**Status:** FROZEN
**Supersedes:** Parts of `2026-05-07-arch-capture-design.md` — THINK Phase 1 protocol and task draft mechanics.

---

## Summary

This spec defines the implementation of `arch think`: the command that promotes captured intents into actionable TASK drafts. It also adds pipe support to `arch capture` and introduces the `DRAFT` task status.

The architecture is a strict three-layer pipeline:

```
capture (ingest)  →  think (promote)  →  human (approve)
```

- `capture` = deterministic signal ingestion. Never interprets.
- `think` = scaffold + cognitive enrichment.
- `human` = sets READY. The only gate that legitimizes execution.

---

## Formal State Model

Three independent state machines. Each has a single responsibility. They do not gate each other.

### INTENT state machine (domain)

| From | Event | To |
|------|-------|----|
| `CAPTURED` | THINK promotes + FinalizePromotion succeeds | `PROMOTED` |
| `CAPTURED` | THINK classifies as retained knowledge | `SIGNAL` |
| `CAPTURED` | THINK classifies as absorbed by existing work | `SUPERSEDED` |
| `CAPTURED` | THINK classifies as no signal value | `DISCARDED` |
| `PROMOTED`, `SIGNAL`, `SUPERSEDED`, `DISCARDED` | — | terminal |

**Operational semantics of non-PROMOTED terminal states:**

| State | Operational effect |
|-------|--------------------|
| `SIGNAL` | Stored in ContextIndex; eligible for ContextInference only. Never promoted to TASK. Informs future context scoring but creates no work. |
| `SUPERSEDED` | Must include `supersedes: INTENT-XXX or TASK-XXX`. Excluded from context queries. No independent operational identity. |
| `DISCARDED` | Excluded from ContextIndex. Subject to cleanup after TTL. Permanently inactive. |

---

### TASK state machine (product — execution eligibility gate)

| From | Event | To |
|------|-------|----|
| `DRAFT` | Human approves | `READY` |
| `DRAFT` | Human rejects | `REJECTED` |
| `READY` | Agent begins work | `IN_PROGRESS` |
| `READY` | Human rejects | `REJECTED` |
| `IN_PROGRESS` | Work submitted for review | `REVIEW` |
| `REVIEW` | Reviewer approves | `DONE` |
| `REVIEW` | Reviewer returns for rework | `IN_PROGRESS` |
| `DONE`, `REJECTED` | — | terminal |

**Execution eligibility is a pure function of TASK.state:**

```
EXECUTION_ELIGIBLE := TASK.state == READY
```

Nothing else contributes. PIPELINE.phase never enters this expression. DRAFT is never eligible. IN_PROGRESS is active execution, not eligibility. This definition does not change with pipeline or enrichment state.

**Visibility is a pure function of TASK.state:**

```
VISIBLE_TO_HUMAN := TASK.state ∈ { DRAFT, READY, IN_PROGRESS, REVIEW, DONE, REJECTED }
```

All tasks in any state are visible. PIPELINE.phase has no role in visibility. The distinction between "ready for review" and "being enriched" is communicated via `arch status` display — informational only, not a gate.

---

### PIPELINE state machine (enrichment infrastructure — audit and display only)

| From | Event | To |
|------|-------|----|
| `scaffolded` | Agent writes patch to `.arch/pending/` | `enriched` |
| `scaffolded` | Scaffold error | `failed` |
| `enriched` | FinalizePromotion succeeds | `finalized` |
| `enriched` | FinalizePromotion fails | `failed` |
| `finalized` | — | terminal |
| `failed` | Human retries (delete TASK file + re-scaffold) | `scaffolded` |

**PIPELINE.phase is debug and display signal only.** It never gates execution, routing, visibility, or any product-layer decision. `arch status` uses it to show `DRAFT (enriching)` vs `DRAFT (awaiting review)` — purely informational.

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

`arch think` is idempotent. Behavior is determined entirely by what is on disk. Run it twice — same outcome.

### Ownership model

The agent NEVER writes TASK or INTENT files directly. It only writes to `.arch/pending/`. The CLI is the sole writer of all final state.

| Artifact | Writer | Mechanism |
|----------|--------|-----------|
| `docs/intents/INTENT-XXX.md` | CLI only | `FinalizePromotion` use case |
| `docs/tasks/TASK-XXX.md` (scaffold + generation) | CLI only | `arch think` Phase 1 |
| `docs/tasks/TASK-XXX.md` (enrichment sections) | CLI only | `FinalizePromotion` use case |
| `.arch/pending/TASK-XXX-patch.json` | Agent only | Agent's sole output mechanism |
| `.arch/pending/INTENT-XXX-transition.json` | Agent only | Agent's intent transition request |
| `.arch/locks/TASK-XXX.lock` | CLI only | Concurrency guard |
| `.arch/enrichments/TASK-XXX.json` | CLI only | `FinalizePromotion` use case |

---

## Phase 1 — Scaffold (CLI, deterministic)

For each CAPTURED intent:

1. Assert promotion safety (see Safety Invariants).
2. Allocate TASK-ID from `MarkdownTaskRepository`.
3. Run `ContextInference.score()` on raw intent text.
4. Write `docs/tasks/TASK-XXX.md` with `enrichment_phase: scaffolded`, `TASK.state: DRAFT`.
5. Print:

```
Scaffold created: TASK-212 ← INTENT-104
enrichment_phase: scaffolded
Agent: enrich TASK-212, then write patches to .arch/pending/
```

---

## Phase 2 — Agent enrichment (structured markdown output, no direct file writes)

The THINK agent reads the scaffolded TASK file and produces two files in `.arch/pending/`.

### TASK_PATCH: `.arch/pending/TASK-XXX-patch.json`

The agent's output is a structured markdown block — not a complex nested JSON schema. The agent writes what it does naturally; the CLI validates and applies.

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
  "content": "## TASK-212: Fix OAuth callback session loss\n\n**Meta:** P1 | M | DRAFT | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/...\n**Source:** INTENT-104\n**Depends:** none\n\n### Objective\n\nStabilize OAuth callback redirect to prevent session loss at the boundary...\n\n### Acceptance Criteria\n\n- [ ] User remains authenticated after OAuth callback redirect\n- [ ] Session token persists across redirect boundary\n- [ ] Failed callback returns deterministic error state\n- [ ] Existing auth tests pass\n- [ ] New test added for callback/session persistence path\n\n### Complexity\n\nM — isolated auth flow change, no cross-cutting state...\n\n### Confidence\n\nmedium — related files identified, but race conditions in concurrent tabs are uncertain\n\n### Risks\n\n- Refresh token regression under concurrent tab scenario\n- Silent session invalidation on redirect timeout"
}
```

The `content` field is the complete agent-owned portion of the TASK file as markdown. The CLI validates the structure, then merges it with the CLI-owned scaffold.

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

`arch think` detects a valid pending pair and acquires the lock before calling `FinalizePromotion`.

### Locking

Before `FinalizePromotion`, CLI creates `.arch/locks/TASK-XXX.lock` with a timestamp.

- Lock exists with timestamp < 5 minutes old → skip (another process is running).
- Lock exists with timestamp ≥ 5 minutes old → stale lock, warn, clean up, proceed.
- Lock is created at start and deleted at end (success or failure).

This prevents concurrent `arch think` invocations from double-processing the same intent.

### `FinalizePromotion` use case

All-or-nothing semantic via **staging + atomic rename**. Each `rename()` is atomic on POSIX. The order of renames is defined to make partial failures detectable and recoverable.

**Preconditions (abort if violated):**
- Lock acquired
- Patch schema valid, `content` field parseable as markdown
- TASK `enrichment_phase == scaffolded`
- INTENT `status == CAPTURED`
- No existing enrichment snapshot

**Transaction model — staging + ordered atomic rename:**

Stage all writes to temporary files first. No original is touched until all staged files are ready.

```
Stage:
  .arch/staging/TASK-XXX.md       ← merged TASK content
  .arch/staging/INTENT-XXX.md     ← updated INTENT (PROMOTED)
  .arch/staging/snapshot.json     ← enrichment snapshot

Commit (rename in order — each rename is individually atomic):
  rename staging/TASK-XXX.md       → docs/tasks/TASK-XXX.md      [step A]
  rename staging/INTENT-XXX.md     → docs/intents/INTENT-XXX.md  [step B]
  rename staging/snapshot.json     → .arch/enrichments/TASK.json  [step C]

Cleanup:
  delete .arch/pending/ files
  delete .arch/locks/ file
  delete .arch/staging/ files if any remain
```

**Rename order is intentional.** Recovery detection uses `enrichment_phase` as the authority:

| After step A | After step B | After step C | State | Recovery |
|---|---|---|---|---|
| ✗ | ✗ | ✗ | Nothing written — TASK still `scaffolded` | Re-run `FinalizePromotion` |
| ✓ | ✗ | ✗ | TASK `finalized`, INTENT still `CAPTURED` | Re-apply step B only |
| ✓ | ✓ | ✗ | TASK + INTENT consistent, snapshot missing | Re-generate snapshot only |
| ✓ | ✓ | ✓ | Fully consistent | Nothing to do |

**On complete success:** `.arch/pending/`, `.arch/locks/`, and `.arch/staging/` are all empty.

**On failure at any step:**
- Staged files not yet renamed → delete staging, no originals touched
- Staged files partially renamed → recoverable via table above; `arch think` detects and repairs on next run
- `enrichment_phase: failed` set only for unrecoverable errors (e.g., content parse failure before staging)
- Error written to `.arch/enrichments/TASK-XXX-error.json` (includes original patch)
- Pending files deleted. Lock deleted.
- INTENT remains `CAPTURED` until step B completes.

**Invariant: `.arch/pending/`, `.arch/locks/`, and `.arch/staging/` are empty after every `arch think` execution.**

---

### Failure recovery policy — Manual (Option A)

Failed tasks remain in `failed` state indefinitely. No automatic retry.

**Recovery procedure:**
1. Human inspects `.arch/enrichments/TASK-XXX-error.json` to understand the failure.
2. Human deletes `docs/tasks/TASK-XXX.md` (the failed scaffold).
3. Human runs `arch think INTENT-XXX` — re-scaffolds from the original CAPTURED intent.

**Why manual only:**
- LLM failures (bad content, schema drift) are not transient — retrying with the same input produces the same output.
- Automatic retry amplifies bad agent output.
- Human inspection of failures is operationally valuable — it surfaces prompt drift and model degradation.
- The CAPTURED intent is never destroyed; recovery is always available.

Print on success:

```
TASK-212 promoted to DRAFT ← INTENT-104
enrichment_phase: finalized
Ready for human review
```

---

## TASK file format for DRAFT

Agent-owned sections are delivered via the `content` field in the patch and merged by `FinalizePromotion`. CLI-owned sections are never touched by the agent.

```markdown
## TASK-XXX: [title from agent content]

**Meta:** [priority | size from agent content] | DRAFT | Focus:no | [class | cli from agent content]
**Source:** INTENT-XXX  <!-- cli-owned -->
**Depends:** [from agent content]

### Generation  <!-- cli-owned: entire section, never modified by agent -->

enrichment_phase: scaffolded → finalized
scaffolded_by: arch-cli
scaffolded_at: 2026-05-11T10:00:00Z
enriched_by:
  actor: think-agent
  model: claude-sonnet-4-6
  version: v1

### Objective  <!-- agent-owned -->

### Acceptance Criteria  <!-- agent-owned -->

### Complexity  <!-- agent-owned -->

### Confidence  <!-- agent-owned -->

### Relevant Context  <!-- cli-owned: entire section, pre-filled by ContextInference -->

_confidence: 0.72_

**Files:** ...
**ADRs:** ...
**Similar Tasks:** ...

### Risks  <!-- agent-owned -->
```

---

## Use case summary

| Use Case | Responsibility | Writes |
|----------|---------------|--------|
| `CaptureIntent` | Save raw intent | `docs/intents/` |
| `BuildIndex` | Compile context index | `.arch/context-index.json` |
| `ContextInference` | Score relevance for task text | (pure computation) |
| `FinalizePromotion` | All-or-nothing: merge patch + promote INTENT + record audit | `docs/tasks/`, `docs/intents/`, `.arch/enrichments/` |

---

## Task status

```
DRAFT → READY → IN_PROGRESS → REVIEW → DONE
     ↘ REJECTED                      ↘ REJECTED
```

| Status | Meaning |
|--------|---------|
| `DRAFT` | Created by THINK. Visible to human. Not eligible for execution. |
| `READY` | Human approved. **Execution eligible.** |
| `IN_PROGRESS` | Active execution. |
| `REVIEW` | Work complete, in review. |
| `DONE` | Closed. |
| `REJECTED` | Will not be done. |

`BACKLOG`: retained in enum, deprecated, never emitted by `arch think`.

---

## Enrichment snapshot (`.arch/enrichments/TASK-XXX.json`)

Written by `FinalizePromotion`. Immutable after creation.

```json
{
  "task_id": "TASK-212",
  "intent_id": "INTENT-104",
  "finalized_at": "2026-05-11T10:30:00Z",
  "actor": { "name": "think-agent", "model": "claude-sonnet-4-6", "version": "v1" },
  "content": "<original markdown block from agent patch>"
}
```

On failure: `.arch/enrichments/TASK-XXX-error.json` preserves the original patch for debugging and retry.

---

## Safety invariants

| Invariant | Rule |
|-----------|------|
| Only CAPTURED intents are promotable | `INTENT.status != CAPTURED` → abort |
| Promotion is single-shot | `INTENT.promoted_to` not empty → abort |
| No task overwrite | `docs/tasks/TASK-XXX.md` exists → abort at scaffold |
| No patch overwrite | Pending patch exists for same TASK → skip |
| Concurrency guard | Lock present and fresh → skip |
| INTENT written only by FinalizePromotion | No other code path writes INTENT status |
| No partial promotion | INTENT marked PROMOTED only after all steps complete |
| Patch pair required | Both files required; orphan files cleaned up |
| `.arch/pending/`, `.arch/locks/`, `.arch/staging/` empty after execution | Holds on success and failure |
| Failure preserves error record | `enrichment_phase: failed` + error artifact |
| Multi-intent isolation | One failure does not abort remaining intents |

---

## Testing

- `arch capture` pipe: stdin path, multiline, trim/empty rejection, argv priority
- `FinalizePromotion` happy path: all artifacts written, pending/locks empty, TASK/INTENT consistent
- `FinalizePromotion` failure path: `enrichment_phase: failed`, error record written, INTENT unchanged, pending/locks empty
- Locking: concurrent invocation produces exactly one success, one skip
- Safety invariants: all eleven, each as independent test
- `arch think` idempotency: running twice produces same outcome
- `enrichment_phase` progression: scaffolded → finalized (happy), scaffolded → failed (error)
- `EXECUTION_ELIGIBLE` = `TASK.state == READY` only: DRAFT, IN_PROGRESS, REVIEW, DONE all return false
- `TaskStatus.DRAFT` parsed and serialized by `MarkdownTaskRepository`
- Integration: INTENT(CAPTURED) → scaffold → agent patches → finalized DRAFT + INTENT(PROMOTED)

---

## Out of scope

- Interactive stdin for `arch capture`
- Agent executing CLI commands for state transitions (by design: forbidden)
- Automatic DRAFT → READY (always human)
- SIGNAL/SUPERSEDED/DISCARDED ContextIndex integration (defined here, implemented in separate spec)
- SIGNAL TTL and cleanup policy (future)
- Clustering or deduplication of intents
- Enrichment replay tooling (future)
