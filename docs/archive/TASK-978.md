## TASK-978: Pre-existence check in arch task start: detect pre-implemented tasks
**Meta:** P1 | S | DONE | Focus:no | 1-code-reasoning | claude-code | cli/src/main/ts/application/use-cases/mark-task-in-progress.ts
**Closed-at:** 2026-05-21T08:40:38.883Z
**Depends:** none

## Hansei
**Severity:** H0
**Category:** [SpecDrift]
**Decision:** Pre-satisfaction detection implemented as an advisory signal. Nuance added to Hansei to distinguish between "phantom work" and legitimate "architectural hardening" where predicates might pass but intent is incomplete.
**Constraint:** Pre-satisfaction detection is non-normative; intent resolution remains a human decision.
**Cost:** No architectural debt; logic encapsulated.
**Forward Action:** Monitor Hansei for "intent vs predicate" drift patterns.
