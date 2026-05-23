## TASK-902: Pre-implementation detection: arch task next --verify
**Meta:** P2 | S | DONE | Focus:no | 7-operations | claude-code | cli/src/main/ts/application/commands/next-command.ts, cli/src/main/ts/application/commands/task-command.ts
**Closed-at:** 2026-05-16T22:37:15.281Z
**Depends:** none

## Hansei
**Severity:** H0
**Category:** [AuditGap]
**Decision:** --verify flag added to NextCommand. Runs DeterministicACVerifier on focus task, emits [PRE-IMPL] to stderr when all predicates pass with >=1 cmd/file AC. Non-blocking (exit 0). Two unit tests pass.
**Constraint:** Dynamic import of DeterministicACVerifier in NextCommand adds minor startup latency on --verify path only.
**Cost:** None — no architectural debt introduced.
**Forward Action:** None required.

## Approval
Approved-by: Auditor | 2026-05-16
