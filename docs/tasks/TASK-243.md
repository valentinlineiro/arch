## TASK-243: Consolidate test mocks into shared module to prevent interface drift
**Meta:** P2 | M | REVIEW | Focus:yes | 2-code-generation | claude-code | cli/src/test/ts/
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

## Hansei
The `written` property on `MockFileSystem` was necessary to preserve test assertions in `build-index` and `context-inference` — a signal that separating write-tracking from read-state is a legitimate test concern, not a quirk to eliminate. The integration test for `GitCli` also revealed that `process.chdir` is needed to make the CLI work in an isolated temp dir, which isn't obvious from the interface alone.
