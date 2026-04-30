## TASK-155: Improve autonomous loop observability and security
**Meta:** P2 | S | DONE | Focus:no | 7-operations | local | cli/src/main/ts/application/use-cases/loop-engine.ts, docs/agents/
**Depends:** none
**Closed-at:** 2026-04-30T12:00:00Z

### Acceptance Criteria
- [x] Implement structured logging in `LoopEngine.ts` to suppress subprocess noise unless `--verbose` is used.
- [x] Add timestamped progress markers for each phase (GOVERN, SELECT, EXEC, REVIEW, ARCHIVE).
- [x] Refactor `runSubprocess` and `runSubprocessWithOutput` to remove `shell: true` and pass arguments as an array, resolving Node.js `DEP0190`.
- [x] Capture and display a summary of agent activity at the end of the EXEC phase.
- [x] `arch review` passes.

### Definition of Done
- [x] All ACs checked.
- [x] `arch review` passes.
