## TASK-964: Implement arch task hansei TASK-XXX interactive wizard: read
**Meta:** P2 | M | DONE | Focus:no | 2-code-generation | local | cli/src/main/ts/
**Closed-at:** 2026-05-20T16:29:00Z
**Depends:** none

## Hansei
**Severity:** H1
**Category:** [SpecDrift]
**Decision:** Task ACs were placeholder stubs at READY time — `file: (path)` and `cmd: npm test` without specifics. Rewrote ACs to name exact predicates before implementing. No scope gap, but spec was underspecified at intake.
**Constraint:** TASK-964 was promoted before the AC template was filled in with real paths. The HanseiWizard class existed but the subcommand wiring and file write-back were undocumented in the task.
**Cost:** Two extra commits (AC rewrite + IN_PROGRESS transition) before implementation could start. Minor overhead, fully bounded.
**Forward Action:** None required — pattern is already caught by the AC rewrite step. Consider adding AC specificity check to the `arch task capture` template for M+ tasks.

## Approval
Auditor: Valentín Liñeiro
Reviewed: 2026-05-20
All 5 ACs verified against actual repo state. 14/14 tests pass. `arch review` exits 0.
