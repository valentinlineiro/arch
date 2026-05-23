## TASK-926: Fix metrics engine integrity breach due to duplicate DONE events
**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | claude | docs/EVENTS.md, cli/src/main/ts/application/commands/report-command.ts
**Closed-at:** 2026-05-18T08:30:00Z

## Hansei

**Severity:** H2
**Category:** [SpecDrift]
**Decision:** THINK misdiagnosed the root cause as DONE→DONE duplicates; actual cause was TASK-922 missing a post-operational DONE event. First fix pass was over-aggressive and removed sole-coverage DONE→DONE records for five READY-status archived tasks, exposing a second failure mode. Root fix required adding a status filter to ArchiveParser — tasks with non-DONE status in docs/archive/ are semantically incomplete and must not be counted in metrics. Once excluded, their DONE→DONE entries became orphaned and could be removed legitimately.
**Constraint:** verifyAppendOnly checks git diff HEAD against EVENTS.md; deletions in uncommitted working-tree state trigger INVALID. Deletions committed to history do not trigger the check at runtime.
**Cost:** Three extra commits and ~45 min of diagnosis across two sessions beyond the minimal fix path.
**Forward Action:** IDEA-archive-parser-skip-non-done is now implemented as part of this task. Remaining risk: tasks with READY status persist in docs/archive/ as legacy anomalies; they should be corrected to DONE or explicitly excised in a follow-up.
