## TASK-168: Implement 'arch mv' to prevent DeadContext drift
**Meta:** P2 | S | READY | Focus:no | 7-operations | local | cli/src/main/ts/application/commands/mv-command.ts, cli/src/main/ts/domain/services/task-mover.ts
**Depends:** none

### Acceptance Criteria
- [ ] Implement `arch mv <source> <destination>` command.
- [ ] Command should perform `git mv` for the file.
- [ ] Command should scan all tasks in `docs/tasks/` and update `Context:` paths matching the source.
- [ ] Support both file and directory moves.

### Definition of Done
- [ ] Moving a file with `arch mv` updates all relevant task Meta lines.
- [ ] `arch review` (DeadContext check) passes after move.
