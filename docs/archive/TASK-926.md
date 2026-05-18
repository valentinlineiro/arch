## TASK-926: Fix metrics engine integrity breach due to duplicate DONE events
**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | claude | docs/EVENTS.md, cli/src/main/ts/application/commands/report-command.ts
**Closed-at:** 2026-05-18T08:30:00Z

### Context

`arch report` failed with a `CRITICAL INTEGRITY BREACH` because `docs/EVENTS.md` contains duplicate `DONE -> DONE` transitions for several tasks (TASK-207, TASK-231, TASK-234, TASK-235, TASK-236, TASK-237). 

The metrics engine expects a linear state machine transition. Duplicate archival events corrupt the cycle-time and throughput calculations.

### Acceptance Criteria

- [x] `docs/EVENTS.md` is cleaned up: the five `DONE -> DONE` entries for TASK-231/234/235/236/237 are removed (enabled by the ArchiveParser fix below).
- [x] `arch report` passes without `INTEGRITY BREACH` warning.
- [x] Metrics engine is hardened to handle duplicate events gracefully (e.g. use only the first `DONE` event for a task) if they ever recur.
- [x] `ArchiveParser.parseArchivedTasks()` skips archived tasks whose `Meta:` status is not `DONE`, preventing false INVALID signals from non-DONE archived tasks.
- [x] `arch review` passes.

### Definition of Done
- [x] `arch report` works.
- [x] `arch review` passes.

## Approval

**Approved-by:** human
**Approved-at:** 2026-05-18T08:30:00Z

## Hansei

**Severity:** H2
**Category:** [SpecDrift]
**Decision:** THINK misdiagnosed the root cause as DONE→DONE duplicates; actual cause was TASK-922 missing a post-operational DONE event. First fix pass was over-aggressive and removed sole-coverage DONE→DONE records for five READY-status archived tasks, exposing a second failure mode. Root fix required adding a status filter to ArchiveParser — tasks with non-DONE status in docs/archive/ are semantically incomplete and must not be counted in metrics. Once excluded, their DONE→DONE entries became orphaned and could be removed legitimately.
**Constraint:** verifyAppendOnly checks git diff HEAD against EVENTS.md; deletions in uncommitted working-tree state trigger INVALID. Deletions committed to history do not trigger the check at runtime.
**Cost:** Three extra commits and ~45 min of diagnosis across two sessions beyond the minimal fix path.
**Forward Action:** IDEA-archive-parser-skip-non-done is now implemented as part of this task. Remaining risk: tasks with READY status persist in docs/archive/ as legacy anomalies; they should be corrected to DONE or explicitly excised in a follow-up.
