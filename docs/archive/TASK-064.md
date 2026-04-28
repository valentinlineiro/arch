## TASK-064: Sync TASK-FORMAT.md with Focus-based model
**Meta:** P1 | M | 5 | DONE | Focus:yes | 6-writing | local | docs/TASK-FORMAT.md, cli/src/, docs/agents/, docs/guidelines/
**Closed-at:** 2026-04-27T00:00:00Z

### Acceptance Criteria
- [x] Rewrite `docs/TASK-FORMAT.md` to define the Focus-based schema (ADR-004) as canonical.
- [x] Update the meta line regex in `docs/TASK-FORMAT.md` to include `Focus: yes/no`.
- [x] Deprecate/Remove Sprint/Backlog terminology from the specification.
- [x] Ensure all examples in `docs/TASK-FORMAT.md` use the current v0.4 format.

### Definition of Done
- [x] `docs/TASK-FORMAT.md` matches the implementation in the CLI validator.
- [x] Documentation is consistent with ADR-004.
