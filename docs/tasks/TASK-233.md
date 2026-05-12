## TASK-233: Add task references for ADR-008 and ADR-013 to clear UnappliedADRs drift
**Meta:** P3 | XS | READY | Focus:no | 6-writing | claude-code | docs/adr/
**Depends:** none

### Context
`arch review` reports ADR-008 (Centralize halt conditions) and ADR-013 (Two-tier drift detection) as ACCEPTED but never referenced in any task file. Both were implemented without a formal task reference. This blocks clean `arch review` output.

### Acceptance Criteria
- [ ] ADR-008 is referenced in at least one task file (existing or new administrative task)
- [ ] ADR-013 is referenced in at least one task file
- [ ] `arch review` UnappliedADRs check passes
