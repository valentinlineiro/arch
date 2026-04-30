## TASK-137: Implement stale lock detection in arch review
**Meta:** P3 | S | READY | Focus:no | 7-operations | local | scripts/arch.sh, cli/
**Depends:** none

### Acceptance Criteria
- [ ] Add a check to `arch review` that scans for tasks in `IN_PROGRESS` status.
- [ ] For each `IN_PROGRESS` task, verify the date of the last git commit.
- [ ] Report a violation if a task has been `IN_PROGRESS` for more than 3 days without a commit.
- [ ] Ensure the check correctly handles git history in local and CI environments.
- [ ] `arch review` passes.

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
