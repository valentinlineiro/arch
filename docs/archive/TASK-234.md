## TASK-234: Clarify JSON/YAML rule scope in documentation guidelines
**Meta:** P3 | XS | READY | Focus:no | 6-writing | claude-code | docs/guidelines/documentation.md
**Depends:** none

### Context
`docs/guidelines/documentation.md` states "no YAML, no JSON" but the project uses arch.config.json, .arch/*.jsonl, and other machine-readable JSON. The rule is contradictory as written.

### Acceptance Criteria
- [ ] Rule clarified to apply strictly to protocol definitions, task files, and human-facing documentation
- [ ] JSON for configuration and machine-readable state explicitly permitted
- [ ] No contradiction with observed system files

## Hansei
**Severity:** H1
**Category:** [SpecDrift]
**Decision:** Task was completed directly in session 2026-05-16 without formal lifecycle. Changes applied before this task file was created. Hansei added retroactively for corpus compliance.
**Constraint:** This task predated the implementation it tracked — created from a stale IDEA batch. Retroactively closed.
**Cost:** No cost — the work was already done when this task was created.
**Forward Action:** None required.

## Approval
Approved-by: Auditor | 2026-05-16
