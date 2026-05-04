## TASK-187: [BUG] INBOX.md coordination surface shows stale active tasks
**Meta:** P1 | XS | REVIEW | Focus:yes | 6-writing | local | docs/INBOX.md
**Depends:** none

### Context
INBOX.md lists TASK-172 and TASK-173 under "Urgent / Actions Required" as active, but both are archived DONE in docs/archive/. The Status Summary counts are wrong and the Last Commit line is stale. This violates the visual management principle: the coordination surface must reflect actual repository state.

Additionally, TASK-176 was implemented in this session but its task file was never updated to REVIEW status and no REVIEW_REQUEST was appended to INBOX.md.

### Acceptance Criteria
- [x] INBOX.md "Urgent / Actions Required" no longer references TASK-172 or TASK-173
- [x] INBOX.md Status Summary counts match actual task state
- [x] `arch review` passes

### Definition of Done
- [x] `arch review` passes
