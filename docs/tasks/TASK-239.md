## TASK-239: Stream arch loop output to terminal
**Meta:** P2 | XS | READY | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/application/use-cases/loop-engine.ts
**Depends:** none

### Context
`LoopEngine` uses `spawnSync` with `stdio: ['ignore', 'pipe', 'inherit']` which suppresses provider stdout during loop execution. A human observer cannot monitor progress in real-time. Output is only visible after cycle completes via metadata.

### Acceptance Criteria
- [ ] Provider stdout streams to terminal during `arch loop` execution
- [ ] Streaming does not break metadata parsing (turns, cost extraction still works)
- [ ] Optional: `--quiet` flag suppresses streaming for non-interactive use
