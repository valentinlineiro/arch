## TASK-137: Implement stale lock detection in arch review
**Meta:** P3 | S | DONE | Focus:no | 7-operations | local | scripts/arch.sh, cli/
**Closed-at:** 2026-04-30T11:44:37.667Z
**Depends:** none

### Description
Implement a check to detect tasks that are stuck in IN_PROGRESS for too long.

### Acceptance Criteria
- [x] Add a check to `arch review` that scans for tasks in `IN_PROGRESS` status (Aligns with ADR-001).
- [x] For each `IN_PROGRESS` task, verify the date of the last git commit.
- [x] Report a violation if a task has been `IN_PROGRESS` for more than 3 days without a commit.
- [x] Ensure the check correctly handles git history in local and CI environments.
- [x] `arch review` passes.

### Definition of Done
- [x] All ACs checked.
- [x] `arch review` passes.
