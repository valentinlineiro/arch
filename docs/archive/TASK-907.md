## TASK-907: Task template linter: validate TASK-FORMAT schema in arch review
**Meta:** P1 | S | DONE | Focus:no | 7-operations | claude-code | cli/src/main/ts/application/use-cases/drift-checker.ts, docs/TASK-FORMAT.md
**Closed-at:** 2026-05-16T22:30:49.160Z
**Depends:** none

## Hansei
**Severity:** H0
**Category:** [AuditGap]
**Decision:** checkTaskTemplateCompliance added to DriftChecker — validates Priority, Size, Class, ACs, and Hansei presence on READY/REVIEW tasks. TASK-FORMAT.md updated with machine-readable schema table. Immediately caught TASK-206 and TASK-242 missing Hansei — fixed.
**Constraint:** Class is validated as non-empty only — no enum check. Class values are open-ended per routing strategy.
**Cost:** O(n) scan over docs/tasks/ on every arch review. Acceptable at current backlog size.
**Forward Action:** None required.

## Approval
Approved-by: Auditor | 2026-05-16
