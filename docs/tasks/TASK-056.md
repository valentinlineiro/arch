## TASK-056: Fix arch.config.json paths drift
**Meta:** P0 | S | IN_PROGRESS | Focus:yes | 7-operations | local | docs/

### Bug
`arch.config.json` references non-existent files:
- `sprint: docs/SPRINT.md`
- `backlog: docs/BACKLOG.md`
- `done: docs/DONE.md`
- `guidelines: docs/GUIDELINES.md`

Actual structure uses directories:
- `docs/tasks/` (active tasks)
- `docs/archive/` (completed tasks)
- `docs/guidelines/` (guidelines directory)

### Root Cause
Migration to flat task structure (v0.4) wasn't reflected in config.

### Fix
Update paths to match actual structure:
```json
{
  "paths": {
    "tasks": "docs/tasks",
    "archive": "docs/archive",
    "guidelines": "docs/guidelines",
    "agents": "docs/agents",
    "refinement": "docs/refinement",
    "adr": "docs/adr"
  }
}
```

### Acceptance Criteria
- [ ] Update paths in arch.config.json to reflect current structure
- [ ] Verify `arch review` passes with new paths
- [ ] Add path validation to arch review to detect future drift