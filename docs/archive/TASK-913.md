## TASK-913: arch task split TASK-XXX : interactive task decomposition
**Meta:** P2 | S | DONE | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/application/commands/task-command.ts
**Closed-at:** 2026-05-17T12:20:24.953Z
**Depends:** none

## Hansei
**Severity:** H1
**Category:** [SpecDrift]
**Decision:** arch task split implemented with non-interactive (--titles) and interactive (TTY) modes. Original L/XL task archived as DONE with split Hansei. Sub-tasks created with inherited class/cli/context/priority and Spawned-from field.
**Constraint:** arch task split does not automatically set Depends: chains between sub-tasks — ordering is the human's responsibility post-split.
**Cost:** Template literal with backticks inside caused a build failure — required string concatenation workaround. Minor friction.
**Forward Action:** None required.

## Approval
Approved-by: Auditor | 2026-05-17
