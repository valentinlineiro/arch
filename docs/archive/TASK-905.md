## TASK-905: Automate turn-count recording in arch task done
**Meta:** P1 | S | DONE | Focus:no | 7-operations | claude-code | cli/src/main/ts/application/use-cases/mark-task-done.ts, cli/src/main/ts/infrastructure/filesystem/markdown-task-repository.ts
**Closed-at:** 2026-05-16T22:28:46.125Z
**Depends:** none

## Hansei
**Severity:** H0
**Category:** [AuditGap]
**Decision:** getCommitCountBetween added to GitRepository interface and NodeGitCli via git rev-list --count. Wired into MarkTaskDone: computes turns from lockedCommit to HEAD, writes Turns field to task file. Two unit tests pass.
**Constraint:** getCommitCountBetween counts commits since lockedCommit was set — this includes all commits from task start to close, not just agent turns. In multi-commit tasks the count reflects total commits, which is a reasonable proxy.
**Cost:** Minor: git rev-list call on every arch task done. Negligible overhead.
**Forward Action:** None required.

## Approval
Approved-by: Auditor | 2026-05-16
