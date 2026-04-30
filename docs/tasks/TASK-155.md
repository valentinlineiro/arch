## TASK-155: Improve autonomous loop observability and security
**Meta:** P2 | S | READY | Focus:no | 7-operations | local | cli/src/main/ts/application/use-cases/loop-engine.ts, docs/agents/
**Depends:** none

### Acceptance Criteria
- [ ] Implement structured logging in `LoopEngine.ts` to suppress subprocess noise unless `--verbose` is used.
- [ ] Add timestamped progress markers for each phase (GOVERN, SELECT, EXEC, REVIEW, ARCHIVE).
- [ ] Refactor `runSubprocess` and `runSubprocessWithOutput` to remove `shell: true` and pass arguments as an array, resolving Node.js `DEP0190`.
- [ ] Capture and display a summary of agent activity at the end of the EXEC phase.
- [ ] `arch review` passes.

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
