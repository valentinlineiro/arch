## TASK-906: arch inbox --resurrect: surface TTL-rejected IDEAs for re-evaluation
**Meta:** P2 | S | DONE | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/application/commands/inbox-command.ts, cli/src/main/ts/application/use-cases/generate-inbox.ts
**Closed-at:** 2026-05-16T22:39:21.268Z
**Depends:** none

## Hansei
**Severity:** H0
**Category:** [AuditGap]
**Decision:** getResurrectQueue() added to GenerateInbox, --resurrect flag added to InboxCommand, renderResurrect() renders 19 eligible IDEAs. THINK Phase 3 step 3 added for periodic resurrection reminders. 409 tests pass.
**Constraint:** Resurrection is display-only — the mechanic for moving IDEAs back is documented in the UI but not automated. Human performs the move manually.
**Cost:** None — no architectural debt introduced.
**Forward Action:** None required.

## Approval
Approved-by: Auditor | 2026-05-16
