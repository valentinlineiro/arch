## TASK-064: Sync TASK-FORMAT.md with Focus-based model
**Meta:** P1 | M | READY | Focus:no | 6-writing | local | docs/TASK-FORMAT.md, cli/src/, docs/agents/, docs/guidelines/

### Acceptance Criteria
- [ ] Rewrite `docs/TASK-FORMAT.md` to define the Focus-based schema (ADR-004) as canonical.
- [ ] Update the meta line regex in `docs/TASK-FORMAT.md` to include `Focus: yes/no`.
- [ ] Deprecate/Remove Sprint/Backlog terminology from the specification.
- [ ] Ensure all examples in `docs/TASK-FORMAT.md` use the current v0.4 format.

### Definition of Done
- [ ] `docs/TASK-FORMAT.md` matches the implementation in the CLI validator.
- [ ] Documentation is consistent with ADR-004.
