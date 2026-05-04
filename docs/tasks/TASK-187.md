## TASK-187: [BUG] INBOX.md coordination surface shows stale active tasks
**Meta:** P1 | XS | IN_PROGRESS | Focus:yes | 6-writing | local | docs/INBOX.md, docs/tasks/TASK-176.md
**Depends:** none

### Context
INBOX.md lists TASK-172 and TASK-173 under "Urgent / Actions Required" as active, but both are archived DONE in docs/archive/. The Status Summary counts are wrong and the Last Commit line is stale. This violates the visual management principle: the coordination surface must reflect actual repository state.

Additionally, TASK-176 was implemented in this session but its task file was never updated to REVIEW status and no REVIEW_REQUEST was appended to INBOX.md.

### Acceptance Criteria
- [ ] INBOX.md "Urgent / Actions Required" no longer references TASK-172 or TASK-173
- [ ] INBOX.md Status Summary counts match actual task state
- [ ] TASK-176.md status updated to REVIEW with REVIEW_REQUEST in INBOX.md
- [ ] `arch review` passes

### Definition of Done
- [ ] `arch review` passes
