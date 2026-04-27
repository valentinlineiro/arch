## TASK-021: Remove `Committed:` field - replace with git-derived commit count
**Meta:** P2 | XS | REJECTED | Backlog | 6-writing | claude | docs/SPRINT.md, docs/agents/RETRO.md
**Depends:** none

### Acceptance Criteria
- [ ] `Committed:` field removed from the SPRINT.md sprint header
- [ ] `Committed:` field removed from the RETRO.md sprint entry template
- [ ] HUMAN.md sprint summary line updated: replace `[N] committed` with `[N] commits (git log --oneline --grep=TASK- | wc -l)`
- [ ] No other agent protocols reference or write the `Committed:` field after this change

### Definition of Done
- [ ] PR approved