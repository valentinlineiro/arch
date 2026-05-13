## TASK-238: Disambiguate Level terminology - autonomy vs escalation scales
**Meta:** P2 | XS | DONE | Focus:yes | 6-writing | claude-code | docs/guidelines/autonomy.md, docs/adr/ | Closed-at: 2026-05-13T13:40:00Z
**Depends:** none

### Context
Two scales share "Level N" terminology: Autonomy Levels (L1-L4 in autonomy.md) and Escalation Maturity Levels (L1-L7 in ADR-010). "Reaching Level 3" is ambiguous. Collision risk increases as the system advances in both dimensions.

### Acceptance Criteria
- [x] One or both scales renamed with non-overlapping prefixes (e.g. Autonomy: A1-A4, Escalation: E1-E7 — or as decided)
- [x] All references updated consistently across docs/guidelines/, docs/adr/, docs/agents/
- [x] No remaining ambiguous "Level N" references that could apply to either scale

## Hansei
Keeping L1–L4 for Autonomy and introducing E1–E7 for Escalation Maturity was the right minimum-churn choice, but the decision should have been recorded as an ADR entry rather than a inline comment in autonomy.md. A brief ADR amendment to ADR-010 noting the renaming would have been cleaner provenance.

