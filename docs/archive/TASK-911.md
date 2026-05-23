## TASK-911: Persistent session identity : Actor field in task lock
**Meta:** P2 | S | DONE | Focus:no | 7-operations | claude-code | cli/src/main/ts/application/use-cases/mark-task-in-progress.ts, cli/src/main/ts/domain/models/task.ts, arch.config.json
**Closed-at:** 2026-05-17T12:05:15.284Z
**Depends:** none

## Hansei
**Severity:** H0
**Category:** [AuditGap]
**Decision:** Actor field added to Task model, resolved from arch.config.json routing strategies in MarkTaskInProgress. Persisted as Actor: field. actorBreakdown added to MetricsEngine and ReportCommand. 415 tests pass.
**Constraint:** resolveActor reads config via taskRepository.fileSystem — this is fragile. A cleaner injection path would pass FileSystem directly to MarkTaskInProgress. Acceptable for now.
**Cost:** None — no architectural debt beyond the constraint above.
**Forward Action:** None required.

## Approval
Approved-by: Auditor | 2026-05-17
