## TASK-217: Automatic entity linking — tasks↔commits
**Meta:** P1 | M | IN_PROGRESS | Focus:yes | 2-code-generation | claude-code | cli/src/main/ts/
**Depends:** TASK-210

### Context
Materialize task↔commit relationships from git history into the ContextIndex so ContextInference can surface causally relevant files when a task text references prior TASK-IDs.

Design: docs/superpowers/specs/2026-05-08-automatic-entity-linking-design.md

### Acceptance Criteria
- [ ] `TaskEntry` interface exists in `context-index.ts` with `commitCount`, `lastCommitDate`, `touchedFrequency`, `recentCommitRefs`, `commitRefOverflow`
- [ ] `ContextIndex.tasks` field exists; version bumped to 2
- [ ] `GitRepository.getCommitHistory()` method added and implemented in `git-cli.ts`
- [ ] `BuildIndex.execute()` requires `gitRepository` as second parameter
- [ ] `normalizeCommits()` pure function extracts TASK-IDs from commit messages
- [ ] `buildTaskIndex()` three-stage pipeline builds `Record<string, TaskEntry>`
- [ ] `ContextResult` has `unresolvedTaskRefs` and `filteredFiles` fields
- [ ] `ContextInference.score()` accumulates all passes into shared Map; task-reference pass applies `DIRECT_TASK_REFERENCE_BOOST`
- [ ] `govern-command.ts`, `index-command.ts`, `index.ts` all updated to pass `gitRepository`
- [ ] All existing 216 tests pass; new tests cover `normalizeCommits` and task-reference scoring

### Definition of Done
- [ ] All ACs checked.
- [ ] `npm test` passes in `cli/`.
