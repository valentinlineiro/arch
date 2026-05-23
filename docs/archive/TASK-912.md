## TASK-912: arch deps TASK-XXX : dependency tree visualization
**Meta:** P2 | S | DONE | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/application/commands/, cli/src/main/ts/index.ts
**Closed-at:** 2026-05-17T12:06:37.474Z
**Depends:** none

## Hansei
**Severity:** H0
**Category:** [AuditGap]
**Decision:** DepsCommand implemented with single-task and --all modes. Cycle detection via DFS. Unblocking leverage computed by counting transitive dependents. arch deps --all shows TASK-206 unlocks 7 tasks.
**Constraint:** arch deps scans only active tasks (docs/tasks/) — archived tasks not traversed. Leverage count excludes archived dependents.
**Cost:** No architectural debt introduced — read-only command, no state mutation.
**Forward Action:** None required.

## Approval
Approved-by: Auditor | 2026-05-17
