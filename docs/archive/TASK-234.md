## TASK-234: Clarify JSON/YAML rule scope in documentation guidelines
**Meta:** P3 | XS | READY | Focus:no | 6-writing | claude-code | docs/guidelines/documentation.md
**Depends:** none

### Context
`docs/guidelines/documentation.md` states "no YAML, no JSON" but the project uses arch.config.json, .arch/*.jsonl, and other machine-readable JSON. The rule is contradictory as written.

### Acceptance Criteria
- [ ] Rule clarified to apply strictly to protocol definitions, task files, and human-facing documentation
- [ ] JSON for configuration and machine-readable state explicitly permitted
- [ ] No contradiction with observed system files
