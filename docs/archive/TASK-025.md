## TASK-025: CLI - arch validate
**Meta:** P0 | M | DONE | Sprint 2 | 2-code-generation | claude-code | docs/TASK-FORMAT.md
**Depends:** TASK-024

### Acceptance Criteria
- [x] `arch validate` available as CLI subcommand
- [x] Validates `arch.config.json` against defined schema (required fields, types, allowed values)
- [x] Validates that SPRINT.md and BACKLOG.md have tasks in v0.2 format (using TASK-FORMAT.md regex)
- [x] Output: list of errors with file + line, or "OK" if all valid
- [x] Exit code 1 on errors, 0 if valid
- [x] Unit tests for at least 3 error cases and the happy path

### Definition of Done
- [x] PR approved
- [x] `arch validate` documented in README or CLI help text