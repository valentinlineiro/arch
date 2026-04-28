## TASK-016: Mandatory EXEC Commits before REVIEW
**Meta:** P1 | S | 5 | DONE | Sprint 1 | 6-writing | claude | docs/agents/EXEC.md
**Depends:** none

### Acceptance Criteria
- [x] `docs/agents/EXEC.md` updated to include a mandatory "Commit artifacts" step as the final action before changing status to `REVIEW`.
- [x] Protocol specifies that the commit message must include the TASK-ID.
- [x] Clarifies that the agent should stop after this commit.

### Definition of Done
- [x] PR approved
- [x] EXEC agent protocol reflects the new requirement.