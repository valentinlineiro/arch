## TASK-078: Implement guarded `arch task done` transition
**Meta:** P2 | S | READY | Focus:yes | 1-implementation | cli | cli/src/main/ts/application/commands/task-command.ts, cli/src/main/ts/application/use-cases/mark-task-done.ts
**Depends:** none

### Acceptance Criteria
- [ ] Inject `Reviewer` or `ReviewSystem` into `MarkTaskDone` use-case.
- [ ] Implement validation check in `MarkTaskDone.execute()`: block transition if violations (e.g., pending ACs) are found.
- [ ] Update `TaskCommand` to handle the validation error and display violations to the user.
- [ ] Add support for a `--force` flag in `TaskCommand` and `MarkTaskDone` to bypass validation.
- [ ] Add unit tests for the guarded transition and the force bypass.

### Definition of Done
- [ ] `arch task done` fails if a task has pending ACs.
- [ ] `arch task done --force` succeeds even with pending ACs.
- [ ] `arch review` passes.
