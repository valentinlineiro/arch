## TASK-905: Automate turn-count recording in arch task done
**Meta:** P1 | S | IN_PROGRESS | Focus:no | 7-operations | claude-code | cli/src/main/ts/application/use-cases/mark-task-done.ts, cli/src/main/ts/infrastructure/filesystem/markdown-task-repository.ts

**Depends:** none

### Context

Mura detection depends on `Turns: N` metadata in archived tasks. The field is manual today and consistently omitted — resulting in total loss of cycle-time signal for `arch report`. The `lockedCommit` field (added in TASK-207) gives a deterministic start boundary. Turn count can be derived from the git commit count between `lockedCommit` and HEAD.

### Acceptance Criteria

- [x] `MarkTaskDone.execute()` computes turn count from git log when `task.lockedCommit` is present: count commits between `lockedCommit` (exclusive) and HEAD (inclusive). If `lockedCommit` is absent, turn count is null (not fabricated).
  - `file: cli/src/main/ts/application/use-cases/mark-task-done.ts`

- [x] Turn count is written to the task file as `**Turns:** N` in the meta block before archival.
  - `file: cli/src/main/ts/infrastructure/filesystem/markdown-task-repository.ts`

- [x] `arch report` cycle-time output uses the recorded Turns field (already parsed by `ArchiveParser` via `turns` field in `ArchivedTaskMetrics`).
  - `cmd: node cli/dist/index.js report`

- [x] Unit test: task with `lockedCommit` set → turns computed from git log mock (N commits between SHA and HEAD). Task without `lockedCommit` → turns is null, no fabrication.
  - `cmd: npm test`

- [x] `arch review` passes.
  - `cmd: node cli/dist/index.js review`

### Definition of Done
- [x] All ACs checked by Auditor
- [x] `arch review` passes
- [x] `npm test` passes in `cli/`

## Hansei
**Severity:** H0
**Category:** [AuditGap]
**Decision:** getCommitCountBetween added to GitRepository interface and NodeGitCli via git rev-list --count. Wired into MarkTaskDone: computes turns from lockedCommit to HEAD, writes Turns field to task file. Two unit tests pass.
**Constraint:** getCommitCountBetween counts commits since lockedCommit was set — this includes all commits from task start to close, not just agent turns. In multi-commit tasks the count reflects total commits, which is a reasonable proxy.
**Cost:** Minor: git rev-list call on every arch task done. Negligible overhead.
**Forward Action:** None required.
