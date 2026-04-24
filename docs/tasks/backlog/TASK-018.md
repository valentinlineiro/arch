## TASK-018: HUMAN agent — duplicate detection before task creation
**Meta:** P2 | XS | READY | Backlog | 6-writing | claude | docs/agents/DO.md
**Depends:** none

### Acceptance Criteria
- [ ] HUMAN.md includes a new step before any task creation: grep title keywords against SPRINT.md, BACKLOG.md, and DONE.md
- [ ] If one or more matches found: list them, halt task creation, and wait for explicit human confirmation or cancellation before proceeding
- [ ] If no matches found: proceed with task creation normally
- [ ] Step applies only to task creation operations, not to status changes or other HUMAN operations

### Definition of Done
- [ ] PR approved
- [ ] HUMAN.md updated with new step in correct position in the protocol