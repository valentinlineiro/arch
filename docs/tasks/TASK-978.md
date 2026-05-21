## TASK-978: Pre-existence check in arch task start: detect pre-implemented tasks
**Meta:** P1 | S | REVIEW | Focus:no | 1-code-reasoning | claude-code | cli/src/main/ts/application/use-cases/mark-task-in-progress.ts

**Depends:** none

### Context

Tasks are sometimes scaffolded after the implementation already exists. The agent marks IN_PROGRESS, "implements" it (code already there), closes it — Hansei says H0 but the diff is empty. This inflates completed task count, produces misleading cycle time data, and caused 58% severity calibration understating in the last 12 measured tasks (TASK-267, 268, 279 — three recurrences same session).

`arch task start` validates DoR but doesn't check if implementation already exists. Fix: lightweight pre-existence check before marking IN_PROGRESS.

### Acceptance Criteria

- [x] `MarkTaskInProgress.execute()` runs a pre-existence check before setting status → file: cli/src/main/ts/application/use-cases/mark-task-in-progress.ts
- [x] Warning message: "⚠ Pre-existence detected..." → prose: verified by unit tests in mark-task-in-progress.test.ts
- [x] Advisory only — does NOT block marking IN_PROGRESS → prose: verified by unit tests
- [x] HanseiWizard receives `preExistenceDetected: boolean` hint → file: cli/src/main/ts/application/use-cases/hansei-wizard.ts
- [x] Unit tests: all-new task vs pre-existing task → cmd: npm test cli/src/test/ts/mark-task-in-progress.test.ts --prefix cli; exit: 0
- [x] `arch review` passes → cmd: node cli/dist/index.js review; exit: 0

### Definition of Done
- [x] All ACs checked by Auditor → prose: Auditor verifies implementation
- [x] `arch review` passes → cmd: node cli/dist/index.js review; exit: 0
- [x] Tests pass → cmd: npm test cli/src/test/ts/mark-task-in-progress.test.ts --prefix cli; exit: 0


## Hansei
**Severity:** H0
**Category:** [SpecDrift]
**Decision:** Implementation completed and verified with unit tests. Pre-existence detection is now functional and integrated with the HanseiWizard.
**Constraint:** No significant constraints were encountered during the implementation of this operational improvement.
**Cost:** No architectural debt was introduced; the logic is encapsulated within existing use-cases.
**Forward Action:** Monitor cycle time metrics to verify the impact of phantom work reduction.
