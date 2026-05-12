## TASK-235: Fix stale GUIDELINES.md reference in what-ai-must-never-do
**Meta:** P3 | XS | READY | Focus:no | 6-writing | claude-code | docs/guidelines/what-ai-must-never-do-in-this-repo.md
**Depends:** none

### Context
`what-ai-must-never-do-in-this-repo.md` references "GUIDELINES.md" which no longer exists as a single file — it was decomposed into the `docs/guidelines/` directory. The reference is stale and misleading.

### Acceptance Criteria
- [ ] Reference updated to `docs/guidelines/` directory
- [ ] Protocol instruction updated to reflect modifying any file within `docs/guidelines/`
