## TASK-932: Add archive status validation to drift-checker ArchiveMetaIntegrity
**Meta:** P2 | XS | DONE | Focus:no | 2-code-generation | claude | cli/src/main/ts/application/use-cases/drift-checker.ts | Closed-at: 2026-05-18T13:00:00Z

## Hansei

**Severity:** H1
**Category:** [SpecDrift]
**Decision:** Added status validation to `checkArchiveMetaIntegrity`. Scans all meta fields for known status token; flags non-terminal statuses (not DONE or REJECTED). Found 6 READY-status archived tasks (TASK-215, 231, 234, 235, 236, 237). Found REJECTED is a valid terminal state — not flagged.
**Constraint:** TASK-215 and 231-237 remain in archive with READY status; fixing those requires a separate corpus repair pass not in this task's scope.
**Cost:** Zero code risk — additive check only, no behavior change for previously-passing tasks.
**Forward Action:** The 6 READY-status archived tasks are now surfaced as WARN. They should be resolved in a follow-up corpus repair task (related to TASK-927 finding residual).
