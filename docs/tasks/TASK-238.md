## TASK-238: Disambiguate Level terminology - autonomy vs escalation scales
**Meta:** P2 | XS | READY | Focus:no | 6-writing | claude-code | docs/guidelines/autonomy.md, docs/adr/
**Depends:** none

### Context
Two scales share "Level N" terminology: Autonomy Levels (L1-L4 in autonomy.md) and Escalation Maturity Levels (L1-L7 in ADR-010). "Reaching Level 3" is ambiguous. Collision risk increases as the system advances in both dimensions.

### Acceptance Criteria
- [ ] One or both scales renamed with non-overlapping prefixes (e.g. Autonomy: A1-A4, Escalation: E1-E7 — or as decided)
- [ ] All references updated consistently across docs/guidelines/, docs/adr/, docs/agents/
- [ ] No remaining ambiguous "Level N" references that could apply to either scale
