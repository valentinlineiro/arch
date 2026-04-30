## TASK-156: Enforce AC completion in arch review
**Meta:** P2 | S | READY | Focus:yes | 7-operations | local | cli/src/main/ts/domain/services/reviewer.ts, cli/src/main/ts/application/use-cases/review-system.ts
**Depends:** none

### Acceptance Criteria
- [ ] Add a check to `Reviewer.ts` or `ReviewSystem.ts` that scans active tasks for `Status: DONE` or `Status: REVIEW`.
- [ ] Ensure any task in these statuses with unchecked Acceptance Criteria (` - [ ] `) fails the review.
- [ ] Verify that the check doesn't conflict with the existing shell guard in `scripts/arch.sh`.
- [ ] `arch review` passes.

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
