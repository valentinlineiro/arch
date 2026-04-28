## TASK-060: Implement English-first language policy for documentation
**Meta:** P2 | XS | 5 | DONE | Focus:yes | 6-writing | local | docs/guidelines/core.md, cli/
**Closed-at:** 2026-04-27T00:00:00Z

### Acceptance Criteria
- [x] Document English-first requirement in `docs/guidelines/core.md` for new docs and task titles
- [x] Establish migration protocol for legacy content (translate on edit)
- [x] Add check in `arch review` to warn about task titles containing non-ASCII characters
- [x] Translate mixed-language guides (e.g. `bugs.md`) to English

### Definition of Done
- [x] Guidelines updated and unified in English
- [x] CLI detects language drift in task titles
- [x] PR approved
