## TASK-031: CLI Completion — Port `done` command and Archive logic
**Meta:** P0 | M | DONE | Sprint 3 | 2-code-generation | claude-code | cli/src/main/ts/
**Depends:** TASK-028

### Acceptance Criteria
- [ ] Implement `arch task done [ID]` in TS CLI.
- [ ] Logic: Update status to `DONE` in Meta line.
- [ ] Logic: Move task file from `docs/tasks/sprint/` to `docs/archive/`.
- [ ] Logic: Update `docs/DONE.md` table with a new entry for the completed task.
- [ ] Unit tests for the new `MarkTaskDone` use case.

### Definition of Done
- [ ] `arch task done TASK-031` successfully archives itself.
- [ ] PR approved.
