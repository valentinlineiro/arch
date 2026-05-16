## TASK-243: Consolidate test mocks into shared module to prevent interface drift
**Meta:** P2 | M | DONE | Focus:no | 2-code-generation | claude-code | cli/src/test/ts/
**Closed-at:** 2026-05-14T00:00:00Z
**Depends:** none

### Acceptance Criteria
- [x] `cli/src/test/ts/mocks/index.ts` exports `MockFileSystem` and `MockGitRepository` that explicitly `implement` their domain interfaces → grep: "implements FileSystem" cli/src/test/ts/mocks/index.ts
- [x] No migrated test file retains a local `MockFileSystem` or `MockGitRepository` declaration → cmd: bash -c "grep -rl 'class MockFileSystem\|class MockGitRepository' cli/src/test/ts/*.test.ts | grep -v ask-corpus | grep -v get-sprint-status | wc -l | grep -q '^0$'"; exit: 0
- [x] `npm test` passes with no regressions → cmd: npm test --prefix cli; exit: 0
- [x] Integration smoke test for `GitCli` exists and passes → file: cli/src/test/ts/git-cli-integration.test.ts

### Definition of Done
- [x] All ACs checked.
- [x] `arch review` passes → cmd: bash scripts/arch.sh review; exit: 0
- [x] `npm test` passes in `cli/`.

## Approval
Approved-by: Auditor | 2026-05-14

## Hansei
**Severity:** H0
**Category:** [SymbolDiscovery]

**Decision:**
Retained `written` as a separate write-tracking field on `MockFileSystem` rather than unifying it with `files`, after test assertions in `build-index` and `context-inference` showed direct dependency on post-write state tracking. Also discovered `process.chdir` is required to make `GitCli` operate in an isolated temp dir.

**Constraint:**
Migrating those test assertions to use `files` directly would have required restructuring unrelated test logic, expanding scope beyond the consolidation goal.

**Cost:**
No debt introduced. The `written`/`files` separation reflects a legitimate test-layer concern: distinguishing "what was written" from "current filesystem state." The `process.chdir` pattern is a known race risk under parallel execution.

**Forward Action:**
The `process.chdir` isolation pattern should be resolved by exposing a `cwd` parameter on `GitCli` constructor — deferred to a future task.
