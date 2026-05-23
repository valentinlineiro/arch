## TASK-959: Implement verifiability-first AC templates per task class in
**Meta:** P1 | M | DONE | Focus:no | 2-code-generation | local | docs/tasks/
**Closed-at:** 2026-05-20T09:10:00Z
**Depends:** none

## Hansei
**Severity:** H0
**Category:** [SpecDrift]
**Decision:** Implementation is clean. VerifiabilityScorer is a 35-line pure domain service with no external dependencies. CaptureCommand integration adds one non-blocking try/catch block. All 11 new tests pass; no regressions in 527-test suite.
**Constraint:** None — no debt introduced.
**Cost:** No additional cost incurred beyond planned implementation scope.
**Forward Action:** None required — implementation complete and verified.
