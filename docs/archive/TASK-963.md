## TASK-963: Refactor DriftChecker.checkExcisionStructure Gate 2 to verif
**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | local | docs/tasks/
**Closed-at:** 2026-05-20T15:10:00Z
**Depends:** none

## Hansei
**Severity:** H0
**Category:** [ReviewBlindspot]
**Decision:** Gate 2 had two divergent branches: one for IDEA archive files (requiring REJECT in Decision section) and one for ADR files (any mention). The asymmetry was inconsistent with the stated invariant — Class I gates verify structural presence, not content. Collapsed to a single check: does any decision record file mention the artifact? TDD isolated this as a one-condition removal.
**Constraint:** None — the two-branch logic had no downstream dependents enforcing the REJECT requirement.
**Cost:** None — 566 tests pass, one new regression guard added.
**Forward Action:** None required.
