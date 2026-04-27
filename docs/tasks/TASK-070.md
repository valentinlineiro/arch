## TASK-070: Implement arch inbox agent for automated reporting
**Meta:** P1 | M | READY | Focus:no | 1-implementation | local | cli/, docs/INBOX.md
**Depends:** TASK-068

### Acceptance Criteria
- [ ] Implement `arch inbox` command.
- [ ] Command scans `docs/tasks/` for active/stale/completed tasks.
- [ ] Command scans git log for recent commits and contributors.
- [ ] Automatically updates `docs/INBOX.md` with a summary of the current state.
- [ ] Detect "Urgent" items (blocked P0/P1 tasks, validation failures).

### Definition of Done
- [ ] Running `arch inbox` produces a valid `INBOX.md`.
- [ ] Summary accurately reflects the backlog state.
- [ ] `arch review` passes.
