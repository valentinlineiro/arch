## TASK-217: Automatic entity linking - tasks-to-commits
**Meta:** P1 | M | DONE | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/
**Depends:** TASK-210

### Context
Materialize task↔commit relationships from git history into the ContextIndex so ContextInference can surface causally relevant files when a task text references prior TASK-IDs.

Design: docs/superpowers/specs/2026-05-08-automatic-entity-linking-design.md

### Acceptance Criteria
- [x] `TaskEntry` interface exists in `context-index.ts` with `commitCount`, `lastCommitDate`, `touchedFrequency`, `recentCommitRefs`, `commitRefOverflow`
- [x] `ContextIndex.tasks` field exists; version bumped to 2
- [x] `GitRepository.getCommitHistory()` method added and implemented in `git-cli.ts`
- [x] `BuildIndex.execute()` requires `gitRepository` as second parameter
- [x] `normalizeCommits()` pure function extracts TASK-IDs from commit messages
- [x] `buildTaskIndex()` three-stage pipeline builds `Record<string, TaskEntry>`
- [x] `ContextResult` has `unresolvedTaskRefs` and `filteredFiles` fields
- [x] `ContextInference.score()` accumulates all passes into shared Map; task-reference pass applies `DIRECT_TASK_REFERENCE_BOOST`
- [x] `govern-command.ts`, `index-command.ts`, `index.ts` all updated to pass `gitRepository`
- [x] All existing 216 tests pass; new tests cover `normalizeCommits` and task-reference scoring

### Definition of Done
- [x] All ACs checked.
- [x] `npm test` passes in `cli/`.

## Hansei
The Phase 1 slice is intentionally narrow. `tasks↔commits` delivers immediate execution value and validates the provenance/scoring model, but the roadmap-level Feature 3 remains partial until `ADRs↔tasks` and `guidelines↔failures` are materialized with equally explicit evidence contracts.
