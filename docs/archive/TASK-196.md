## TASK-196: [BUG] arch task done exits zero when Hansei guard blocks DONE transition
**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/application/commands/task-command.ts, cli/src/test/ts/, docs/agents/DO.md
**Closed-at:** 2026-05-05T11:47:37.490Z
**Depends:** none

### Context
`arch task done TASK-XXX` now blocks post-rollout tasks that lack `## Hansei`, but the CLI catches that error and only prints a warning. The process still exits zero, which lets wrappers and autonomous flows treat a blocked archive as success.

### Acceptance Criteria
- [x] `arch task done TASK-XXX` exits non-zero when `MarkTaskDone` rejects the transition
- [x] Error output remains human-readable and includes the Hansei violation reason
- [x] A CLI-level test covers the non-zero exit behavior for a blocked DONE transition
- [x] `npm test` passes in `cli/`

### Definition of Done
- [x] All ACs checked.
- [x] `arch review` passes.
- [x] `npm test` passes in `cli/`.
