## TASK-020: EXEC — commit prefix validation against GUIDELINES
**Meta:** P2 | XS | READY | Backlog | 6-writing | claude | docs/GUIDELINES.md
**Depends:** TASK-019

### Acceptance Criteria
- [ ] EXEC.md protocol includes a step before every commit: select a prefix from the GUIDELINES.md commit type table
- [ ] If no type fits exactly, pick the closest and append a one-line justification in the commit message
- [ ] Step applies to all commits made by EXEC (status change, implementation, completion)
- [ ] No other agent protocols are modified

### Definition of Done
- [ ] PR approved