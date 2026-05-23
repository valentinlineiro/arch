## TASK-989: Fix config gaps - XL Muri guard and models.md schema mismatch
**Meta:** P2 | S | DONE | Focus:no | 7-operations | local | docs/tasks/
**Closed-at:** 2026-05-22T14:39:20.847Z
**Depends:** none

## Hansei
**Severity:** H0
**Category:** [SpecDrift]
**Decision:** Both gaps fixed cleanly — XL added to Muri thresholds in arch.config.json and models.md rewritten to use strategies schema instead of stale modelTiers.
**Constraint:** arch.config.json is a protected path — modification is within task scope and does not alter governance semantics.
**Cost:** No cost incurred — task has not started.
**Forward Action:** None.
