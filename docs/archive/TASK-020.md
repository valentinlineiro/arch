## TASK-020: EXEC - commit prefix validation against GUIDELINES
**Meta:** P2 | XS | 5 | DONE | Backlog | 6-writing | claude | docs/GUIDELINES.md
**Depends:** TASK-019

### Acceptance Criteria
- [x] EXEC.md protocol includes a step before every commit: select a prefix from the GUIDELINES.md commit type table
- [x] If no type fits exactly, pick the closest and append a one-line justification in the commit message
- [x] Step applies to all commits made by EXEC (status change, implementation, completion)
- [x] No other agent protocols are modified

### Definition of Done
- [x] PR approved