## TASK-171: Implement canonical Meta linter in 'arch review'
**Meta:** P1 | S | REVIEW | Focus:yes | 7-operations | local | cli/src/main/ts/domain/services/reviewer.ts, cli/src/main/ts/application/use-cases/review-system.ts
**Depends:** none

### Acceptance Criteria
- [x] Implement `TaskValidator.validateMeta()` which returns structured errors (e.g., "Missing Class", "Invalid Priority").
- [x] Integrate Meta validation into `Reviewer.reviewTask()`.
- [x] `arch review` should fail if any task in `docs/tasks/` has an invalid Meta line.
- [x] Update `Reviewer` to provide specific evidence for the violation (the invalid line and what's wrong with it).

### Context
#### Problem
`TASK-161` had an invalid Meta format (extra field `Lock:gemini-cli`) that was only detected as a generic `FormatViolation` drift. This caused the loop to fail without clear feedback.

#### Solution
Move from generic regex matching to structured validation in the core review cycle.

### Definition of Done
- [x] `arch review` correctly identifies and describes a non-canonical Meta line.
- [x] `arch review` passes on the current repository.
