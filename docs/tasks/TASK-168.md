## TASK-168: Implement 'arch mv' to prevent DeadContext drift
**Meta:** P2 | S | IN_PROGRESS | Focus:yes | 7-operations | local | docs/tasks/
**Depends:** none

### Acceptance Criteria
- [x] Implement `arch mv <source> <destination>` command.
- [x] Command should perform `git mv` for the file.
- [x] Command should scan all tasks in `docs/tasks/` and update `Context:` paths matching the source.
- [x] Support both file and directory moves.

### Definition of Done
- [x] Moving a file with `arch mv` updates all relevant task Meta lines.
- [x] `arch review` (DeadContext check) passes after move.
