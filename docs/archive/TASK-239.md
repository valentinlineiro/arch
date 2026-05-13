## TASK-239: Stream arch loop output to terminal
**Meta:** P2 | XS | REVIEW | Focus:yes | 2-code-generation | claude-code | cli/src/main/ts/application/use-cases/loop-engine.ts
**Depends:** none

### Context
`LoopEngine` uses `spawnSync` with `stdio: ['ignore', 'pipe', 'inherit']` which suppresses provider stdout during loop execution. A human observer cannot monitor progress in real-time. Output is only visible after cycle completes via metadata.

### Acceptance Criteria
- [x] Provider stdout streams to terminal during `arch loop` execution
- [x] Streaming does not break metadata parsing (turns, cost extraction still works)
- [x] Optional: `--quiet` flag suppresses streaming for non-interactive use

## Hansei
Replaced `spawnSync` with an async `spawn`-based `runStreaming` helper that tees stdout. The `spawnSync` import is now unused and could be removed, but TASK-240 may rely on it — left for the next task to clean up.

