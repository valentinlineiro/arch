## TASK-174: Fix loop mode performance - eliminate subprocess cold starts
**Meta:** P1 | M | IN_PROGRESS | Focus:yes | 2-code-generation | claude-code | cli/src/main/ts/application/use-cases/loop-engine.ts, cli/src/main/ts/application/use-cases/govern-system.ts, cli/src/main/ts/application/use-cases/review-system.ts, cli/src/main/ts/application/use-cases/mark-task-done.ts
**Depends:** none

### Context
Each loop cycle currently spawns 3+ Node.js subprocesses (govern, review, task done) in addition to the unavoidable `arch exec` subprocess. `arch task done` also re-triggers `arch govern` internally via arch.sh, causing a double-govern per cycle. All of govern, review, and archive share the same domain interfaces already held by `LoopEngine` — they can run in-process.

### Acceptance Criteria
- [ ] `LoopEngine` calls `GovernSystem.execute(true)` directly instead of spawning `arch govern --no-conduct`
- [ ] `LoopEngine` calls `ReviewSystem` directly instead of spawning `arch review`
- [ ] `LoopEngine` handles archive/done logic directly instead of spawning `arch task done`
- [ ] `arch exec` remains the only subprocess call in the loop cycle
- [ ] Double-govern per cycle is eliminated
- [ ] `arch loop --dry-run` still works correctly
- [ ] `arch loop --resume` still works correctly

### Definition of Done
- [ ] `arch review` passes
- [ ] `npm test` passes in `cli/`
