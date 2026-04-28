## TASK-078: Implement guarded `arch task done` transition
**Meta:** P2 | S | DONE | Focus:yes | 1-implementation | cli | cli/src/main/ts/application/commands/task-command.ts, cli/src/main/ts/application/use-cases/mark-task-done.ts
**Depends:** none
**Closed-at:** 2026-04-28T00:00:00Z

### Acceptance Criteria
- [x] Inject `Reviewer` or `ReviewSystem` into `MarkTaskDone` use-case.
- [x] Implement validation check in `MarkTaskDone.execute()`: block transition if violations (e.g., pending ACs) are found.
- [x] Update `TaskCommand` to handle the validation error and display violations to the user.
- [x] Add support for a `--force` flag in `TaskCommand` and `MarkTaskDone` to bypass validation.
- [x] Add unit tests for the guarded transition and the force bypass.

### Definition of Done
- [x] `arch task done` fails if a task has pending ACs.
- [x] `arch task done --force` succeeds even with pending ACs.
- [x] `arch review` passes.
