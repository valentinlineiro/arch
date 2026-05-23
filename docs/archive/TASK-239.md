## TASK-239: Stream arch loop output to terminal
**Meta:** P2 | XS | DONE | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/application/use-cases/loop-engine.ts | Closed-at: 2026-05-13T13:50:00Z
**Depends:** none

## Hansei
Replaced `spawnSync` with an async `spawn`-based `runStreaming` helper that tees stdout. The `spawnSync` import is now unused and could be removed, but TASK-240 may rely on it — left for the next task to clean up.
