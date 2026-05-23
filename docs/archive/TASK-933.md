## TASK-933: Repair corpus drift in TASK-249, TASK-919, TASK-258
**Meta:** P2 | XS | DONE | Focus:no | 9-audit | claude | docs/tasks/TASK-249.md, docs/tasks/TASK-919.md, docs/tasks/TASK-258.md | Closed-at: 2026-05-18T12:00:00Z

## Hansei

**Severity:** H1
**Category:** [SpecDrift]
**Decision:** Three metadata violations cleared: TASK-249 Focus:yes→no, TASK-919 Focus:no→yes, TASK-258 AC format converted and Hansei stub added. No protocol changes required.
**Constraint:** Remaining TaskTemplateCompliance warnings (TASK-259 through TASK-284) are pre-existing — beyond this task's scope.
**Cost:** Zero — pure metadata edits, no implementation risk.
**Forward Action:** TASK-927 can close once TASK-930, 931, 932 are done. TaskTemplateCompliance residual backlog tracked by IDEA-tiered-obligations (once promoted).
