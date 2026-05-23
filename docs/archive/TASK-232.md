## TASK-232: Grandfather legacy tasks in arch review - silence Hansei warnings
**Meta:** P2 | XS | DONE | Focus:no | 7-operations | claude-code | cli/src/main/ts/application/use-cases/drift-checker.ts | Closed-at: 2026-05-13T13:30:00Z
**Depends:** none

## Hansei
The root cause was a path mismatch: `hanseiSinceTaskId` lives under `config.governance` in `arch.config.json` but the checker read it from the root. The fix was one line; the better fix would have been consistent nesting from the start.
