## TASK-233: Add task references for ADR-008 and ADR-013 to clear UnappliedADRs drift
**Meta:** P2 | XS | DONE | Focus:no | 6-writing | claude-code | docs/adr/
**Closed-at:** 2026-05-13T14:15:00Z
**Depends:** none

### Context
`arch review` reports ADR-008 (Centralize halt conditions) and ADR-013 (Two-tier drift detection) as ACCEPTED but never referenced in any task file. Both were implemented without a formal task reference. This blocks clean `arch review` output.

Implements: ADR-008, ADR-013

### Acceptance Criteria
- [x] ADR-008 is referenced in at least one task file (existing or new administrative task)
- [x] ADR-013 is referenced in at least one task file
- [x] `arch review` UnappliedADRs check passes

## Hansei
Adding "Implements: ADR-008, ADR-013" to this task's own context is the minimal correct fix. Ideally the original implementation commits for these ADRs would have referenced a task that cited the ADR — the gap exists because both ADRs were applied without a corresponding task.

