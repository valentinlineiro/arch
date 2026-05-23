## TASK-922: arch capture v2: single intake command producing a READY task
**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/index.ts, cli/src/main/ts/application/commands/
**Closed-at:** 2026-05-17T22:06:24.493Z
**Depends:** TASK-921

## Hansei
**Severity:** H0
**Category:** [AuditGap]
**Decision:** arch capture implemented as single intake command. Orchestrates CreateTask -> DoR validation -> auto-fix mechanical violations (CLI, context) -> IN_PROGRESS. AGENTS.md updated with arch capture as primary intake. Non-TTY exits 1 with clear message when manual fixes needed.
**Constraint:** Auto-fix only handles CLI and context path violations. Priority, Size, Class require human edit since they are intent-dependent.
**Cost:** No architectural debt introduced.
**Forward Action:** None required.
