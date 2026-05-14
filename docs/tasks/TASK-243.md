## TASK-243: Consolidate test mocks into shared module to prevent interface drift
**Meta:** P2 | M | IN_PROGRESS | Focus:yes | 2-code-generation | claude-code | cli/src/test/ts/
**Depends:** none

### Acceptance Criteria
- [ ] `cli/src/test/ts/mocks/index.ts` exports `MockFileSystem` and `MockGitRepository` that explicitly `implement` their domain interfaces → grep: "implements FileSystem" cli/src/test/ts/mocks/index.ts
- [ ] All 15 active test files import mocks from the shared module instead of declaring local classes → cmd: grep -rL "from.*mocks" cli/src/test/ts/*.test.ts | grep -v git-cli-integration | wc -l | grep -q "^0$"; exit: 0
- [ ] `npm test` passes with no regressions → cmd: npm test --prefix cli; exit: 0
- [ ] Integration smoke test for `GitCli` exists and passes → file: cli/src/test/ts/git-cli-integration.test.ts

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes → cmd: bash scripts/arch.sh review; exit: 0
- [ ] `npm test` passes in `cli/`.
