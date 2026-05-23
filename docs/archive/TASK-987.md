## TASK-987: Clean up stale CI workflows and scripts  remove exec.yml, c
**Meta:** P3 | M | DONE | Focus:no | 7-operations | local | docs/tasks/
**Closed-at:** 2026-05-22T12:04:12.128Z
**Depends:** none

## Hansei
**Severity:** H0
**Category:** [SpecDrift]
**Decision:** Removed 4 stale and dangerous GitHub Actions workflows, rewrote review.yml to use CLI directly, removed dead shell shim and registry directory.
**Constraint:** Pre-existing FOCUS_INTEGRITY_VIOLATION in arch review is unrelated to this task.
**Cost:** No cost introduced — pure cleanup of dead code and risk reduction (removed autonomous agent CI runs with API keys).
**Forward Action:** None required.
## Approval
Approved-by: Auditor | 2026-05-22
Rationale: Clean up stale CI workflows and scripts — H0, deletions only, no regressions.
