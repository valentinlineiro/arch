## TASK-013: Fix HUMAN agent - sync BACKLOG and SPRINT in one operation
**Meta:** P1 | S | 5 | DONE | Sprint 1 | 6-writing | claude | docs/agents/HUMAN.md
**Depends:** none

### Acceptance Criteria
- [x] `docs/agents/HUMAN.md` "Mueve [tarea(s)] al sprint" operation updated to modify both BACKLOG.md and SPRINT.md atomically
- [x] Decision recorded: BACKLOG entry is updated (status field) or removed - one approach chosen and documented
- [x] Single commit covers both file changes (no two-step drift window)
- [x] Existing "After every operation" report section updated if status vocabulary changes

### Definition of Done
- [x] PR approved
- [x] No status-drift possible between BACKLOG.md and SPRINT.md after a "move to sprint" operation