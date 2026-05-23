## TASK-233: Add task references for ADR-008 and ADR-013 to clear UnappliedADRs drift
**Meta:** P2 | XS | DONE | Focus:no | 6-writing | claude-code | docs/adr/
**Closed-at:** 2026-05-13T14:15:00Z
**Depends:** none

## Hansei
Adding "Implements: ADR-008, ADR-013" to this task's own context is the minimal correct fix. Ideally the original implementation commits for these ADRs would have referenced a task that cited the ADR — the gap exists because both ADRs were applied without a corresponding task.
