## TASK-978: Pre-existence check in arch task start: detect pre-implemented tasks
**Meta:** P1 | S | DONE | Focus:no | 1-code-reasoning | claude-code | cli/src/main/ts/application/use-cases/mark-task-in-progress.ts
**Closed-at:** 2026-05-21T08:40:38.883Z

**Depends:** none

### Context

Tasks are sometimes scaffolded after the implementation already exists. The agent marks IN_PROGRESS, "implements" it (code already there), closes it — Hansei says H0 but the diff is empty. This inflates completed task count, produces misleading cycle time data, and caused 58% severity calibration understating in the last 12 measured tasks (TASK-267, 268, 279 — three recurrences same session).

`arch task start` validates DoR but doesn't check if implementation already exists. Fix: lightweight "Possible Pre-Satisfaction" check before marking IN_PROGRESS.

### Acceptance Criteria

- [x] `MarkTaskInProgress.execute()` runs a pre-satisfaction check before setting status → file: cli/src/main/ts/application/use-cases/mark-task-in-progress.ts
- [x] Warning message: "⚠ Possible pre-satisfaction detected: all verifiable ACs pass. Verify if intent is genuinely resolved or if this is a refactor/hardening task." → prose: verified by unit tests in mark-task-in-progress.test.ts
- [x] Advisory only — does NOT block marking IN_PROGRESS → prose: verified by unit tests
- [x] HanseiWizard receives `preSatisfactionDetected: boolean` hint. When true, asks: "Was intent already resolved, or is this architectural hardening/refactoring?" → file: cli/src/main/ts/application/use-cases/hansei-wizard.ts
- [x] Unit tests: all-new task vs pre-satisfied task → cmd: npm test cli/src/test/ts/mark-task-in-progress.test.ts --prefix cli; exit: 0
- [x] `arch review` passes → cmd: node cli/dist/index.js review; exit: 0

### Definition of Done
- [x] All ACs checked by Auditor → prose: Auditor verifies implementation
- [x] `arch review` passes → cmd: node cli/dist/index.js review; exit: 0
- [x] Tests pass → cmd: npm test cli/src/test/ts/mark-task-in-progress.test.ts --prefix cli; exit: 0


## Hansei
**Severity:** H0
**Category:** [SpecDrift]
**Decision:** Pre-satisfaction detection implemented as an advisory signal. Nuance added to Hansei to distinguish between "phantom work" and legitimate "architectural hardening" where predicates might pass but intent is incomplete.
**Constraint:** Pre-satisfaction detection is non-normative; intent resolution remains a human decision.
**Cost:** No architectural debt; logic encapsulated.
**Forward Action:** Monitor Hansei for "intent vs predicate" drift patterns.
