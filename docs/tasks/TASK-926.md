## TASK-926: Fix metrics engine integrity breach due to duplicate DONE events
**Meta:** P1 | S | REVIEW | Focus:no | 2-code-generation | claude | docs/EVENTS.md, cli/src/main/ts/application/commands/report-command.ts

### Context

`arch report` failed with a `CRITICAL INTEGRITY BREACH` because `docs/EVENTS.md` contains duplicate `DONE -> DONE` transitions for several tasks (TASK-207, TASK-231, TASK-234, TASK-235, TASK-236, TASK-237). 

The metrics engine expects a linear state machine transition. Duplicate archival events corrupt the cycle-time and throughput calculations.

### Acceptance Criteria

- [x] `docs/EVENTS.md` is cleaned up: duplicate `DONE -> DONE` lines are removed.
- [x] `arch report` passes without `INTEGRITY BREACH` warning.
- [x] Metrics engine is hardened to handle duplicate events gracefully (e.g. use only the first `DONE` event for a task) if they ever recur.
- [x] `arch review` passes.

### Definition of Done
- [x] `arch report` works.
- [x] `arch review` passes.

## Hansei

**Severity:** H2
**Category:** [SpecDrift]
**Decision:** THINK misdiagnosed the root cause as DONE→DONE duplicates; actual cause was TASK-922 missing a post-operational DONE event. Over-aggressive EVENTS.md cleanup removed the sole-coverage DONE→DONE records for five tasks with READY status in archive, exposing a second failure mode and requiring a correction commit.
**Constraint:** EVENTS.md entries cannot be removed once committed without triggering verifyAppendOnly at runtime; DONE→DONE entries that are the sole coverage record for a task must be retained even if semantically impure.
**Cost:** Two extra commits and ~30 min of diagnosis iteration beyond the minimal fix path.
**Forward Action:** See IDEA-archive-parser-skip-non-done — ArchiveParser should skip non-DONE tasks in docs/archive/ to eliminate the structural precondition for this class of integrity false-positive.
