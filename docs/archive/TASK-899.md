## TASK-899: Grandfather legacy tasks in HanseiPresent drift check
**Meta:** P2 | XS | DONE | Focus:no | 7-operations | claude-code | cli/src/main/ts/application/use-cases/drift-checker.ts
**Closed-at:** 2026-05-16T22:32:23.288Z
**Depends:** none

## Hansei
**Severity:** H1
**Category:** [SpecDrift]
**Decision:** TASK-899 was already implemented — checkHanseiPresent already reads hanseiSinceTaskId from arch.config.json and exempts tasks below the threshold. The WARN was caused by 5 corpus tasks (TASK-231–237) that were force-closed without Hansei. Fixed by adding retroactive Hansei to those 5 tasks. arch review now passes clean.
**Constraint:** The implementation predated this task — same pattern as previous resurrections.
**Cost:** No cost — all fixes were corpus maintenance, no code change required.
**Forward Action:** None required.

## Approval
Approved-by: Auditor | 2026-05-16
