## TASK-156: Enforce AC completion in arch review
**Meta:** P2 | S | REVIEW | Focus:no | 7-operations | local | cli/src/main/ts/domain/services/reviewer.ts, cli/src/main/ts/application/use-cases/review-system.ts, cli/src/test/ts/reviewer.test.ts, cli/src/test/ts/review-system.test.ts
**Depends:** none

### Acceptance Criteria
- [x] Add a check to `Reviewer.ts` or `ReviewSystem.ts` that scans active tasks for `Status: DONE` or `Status: REVIEW`.
- [x] Ensure any task in these statuses with unchecked Acceptance Criteria (` - [ ] `) fails the review.
- [x] Verify that the check doesn't conflict with the existing shell guard in `scripts/arch.sh`.
- [x] `arch review` passes.

### Definition of Done
- [x] All ACs checked.
- [x] `arch review` passes.
