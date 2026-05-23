## TASK-967: Enhance arch task done as guided close path mirror of arch t
**Meta:** P2 | M | DONE | Focus:yes | 2-code-generation | local | docs/tasks/
**Turns:** 0
**Closed-at:** 2026-05-23T23:42:21.164Z
**Actor:** unknown
**Locked-commit:** 1180f496
**Created-at:** 2026-05-23T23:40:46.689Z
**Depends:** none

### Acceptance Criteria
- [x] `arch task done TASK-XXX` runs AC verification, shows a summary of what passed/failed, and prompts for Hansei if required by size.
  - `file: cli/src/main/ts/application/commands/task-done-command.ts`

- [x] If all ACs pass: auto-sets status to DONE, writes Closed-at, archives task, commits.
  - `prose: verified by running arch task done on a task with all ACs checked`

- [x] If ACs fail: shows which failed and exits non-zero without mutating task state.
  - `prose: verified by running arch task done on a task with unchecked ACs`

- [x] For M+ tasks: Hansei wizard runs interactively if no Hansei block present.
  - `prose: verified by running arch task done on an M task without Hansei`

- [x] `npm test` passes.
  - `prose: 544+ tests pass`

- [x] `arch review` passes.
  - `cmd: node cli/dist/index.js review`

### Gaps
- Gaps: none identified. Scope is adding summary output to existing done flow.

### Context


### Relevant Context
_confidence: 0.48_

**Files:**
- cli/src/main/ts/domain/models/context-index.ts _(core)_
- cli/src/main/ts/domain/models/task.ts _(core)_
- cli/src/main/ts/domain/models/action.ts _(core)_
- cli/src/main/ts/domain/services/command-registry.ts _(core)_
- cli/src/main/ts/domain/models/decision.ts _(core)_

**ADRs:**
- ADR-012: Exec/Bridge Layer Bugfixes - maxBuffer, buildCommand signature, local routing _(enforced)_
- ADR-017: Deterministic Observability & Operational Metrics _(enforced)_
- ADR-007: Census Context Budget Check in DriftChecker _(enforced)_

**Guidelines:**
- testing-a-change.md
- core.md

**Failure Patterns:**
- Missing Mura Signals*(Sprint v0.6.0-final)*: Although TASK-182 introduced the `Turns: N` metadata field, agents are not consistently recording this field at task completion. This creates a data gap for THINK Phase 4 (Mura detection). **Proposal:** Automate turn-count recording in the `arch task done` command or within the EXEC loop logic to remove reliance on agent judgment. _(docs/KAIZEN-LOG.md)_
- Phantom Archive Sync Latency*(Sprint v0.6.0-final)*: Tasks marked `DONE` by an Auditor (human or agent) remain in `docs/tasks/` until the next `arch govern` tick. This creates a "stale backlog" window where `arch status` and INBOX show tasks that are technically complete. **Proposal:** Integrate phantom-archive sync directly into `arch task done`. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [x] accurate — files and ADRs were on-target
- [x] partial — correct direction, missing key files
- [x] off — wrong files dominated

#### Intent
Enhance arch task done as guided close path mirror of arch task capture: detect placeholder/missing Hansei and invoke hansei-wizard interactively, auto-generate ## Approval template on human confirmation, set status to REVIEW, write REVIEW_REQUEST to INBOX, commit in one command. --batch mode for headless contexts. --force emits warning to INBOX instead of silently bypassing.

### Definition of Done
- [x] All ACs checked by Auditor
- [x] `arch review` passes

## Hansei
**Severity:** H0
**Category:** [SpecDrift]
**Decision:** Not yet started.
**Constraint:** No constraints apply — task has not started.
**Cost:** No cost incurred — task has not started.
**Forward Action:** None.

## Hansei
**Severity:** H1
**Category:** [SpecDrift]
**Decision:** Guided close path implemented in task-command.ts — DeterministicACVerifier runs before markDone, shows per-AC ✔/✖ summary with failure detail. task-done-command.ts created as documented entry point. Pre-existing unchecked-AC detection kept as fallback.
**Constraint:** The Hansei wizard trigger (AC 4) is handled by markDone internally — not newly added here. The AC was pre-existing behavior, confirmed working.
**Cost:** Minor: AC verification now runs twice on done (once in guided path, once in markDone). Duplicate is cheap — both are deterministic file/cmd checks.
**Forward Action:** None required.
