## TASK-908: arch review --task: scoped Auditor review command
**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/application/commands/review-command.ts, cli/src/main/ts/application/use-cases/review-system.ts
**Closed-at:** 2026-05-17T07:11:09.835Z
**Depends:** none

## Hansei
**Severity:** H0
**Category:** [AuditGap]
**Decision:** executeScopedReview() added to ReviewCommand. Shows AC evidence table, Hansei completeness, and meta compliance for a single task. Exit 1 on any failure. Live test on TASK-909 showed correct output. 409 tests pass.
**Constraint:** Scoped review runs DeterministicACVerifier which executes cmd: predicates — can be slow for test-runner ACs.
**Cost:** No architectural debt introduced.
**Forward Action:** None required.

## Approval
Approved-by: Auditor | 2026-05-17
