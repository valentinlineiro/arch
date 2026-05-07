## TASK-214: Fix exec/bridge layer: remove unused content param, add maxBuffer, fix local routing
**Meta:** P1 | XS | IN_PROGRESS | Focus:yes | 9-bugfix | claude-code | cli/src/main/ts/domain/services/bridge-provider.ts, cli/src/main/ts/domain/services/sandbox.ts, cli/src/main/ts/application/commands/exec-command.ts, cli/src/main/ts/application/use-cases/loop-engine.ts
**Lock:** claude-code
**Depends:** none

### Context
Three latent bugs discovered in the exec/bridge layer after the TASK-211/213 unified strategy refactor:
1. `BridgeProvider.buildCommand` accepted a `content: string` parameter that was never used — the method always writes content to a temp file and uses `$(cat file)` in the shell command. Removing it eliminates a misleading API surface.
2. `spawnSync` calls in BridgeProvider, ExecCommand, LoopEngine, and SandboxService had no `maxBuffer` limit. Long LLM outputs (e.g. full session transcripts) trigger `ENOBUFS`. Setting `maxBuffer: Infinity` matches the intent of piping arbitrary-length output.
3. The `local` routing mode check in ExecCommand was evaluated before the candidates loop, which meant it fired even when the provider list was partially resolved. Moving the check inside the loop ensures `local` is only triggered when it's the actual candidate being processed.

### Acceptance Criteria
- [x] `BridgeProvider.buildCommand` signature is `(model: string, promptFile: string)` — content param removed → code: cli/src/main/ts/domain/services/bridge-provider.ts
- [x] All `spawnSync` calls in bridge-provider.ts, exec-command.ts, loop-engine.ts, sandbox.ts include `maxBuffer: Infinity` → code: verified
- [x] `local` routing in ExecCommand is checked inside the candidates loop → code: cli/src/main/ts/application/commands/exec-command.ts
- [x] `local` routing in LoopEngine appends ANDON_HALT and halts → code: cli/src/main/ts/application/use-cases/loop-engine.ts
- [x] Tests updated for new `buildCommand` signature → test: npm test; exit: 0
- [x] `npm test` passes in `cli/` → cmd: npm test --prefix cli; exit: 0

### Definition of Done
- [x] All ACs checked.
- [x] `arch review` passes.
- [x] `npm test` passes in `cli/`.

## Hansei
All three issues were silent regressions introduced when the unified provider strategy layer was assembled. The unused `content` param survived because callers consistently passed the content string even though it was ignored. The `maxBuffer` gap only manifests with large outputs, making it hard to catch in unit tests. Moving the `local` check inside the loop is a correctness fix that required reading the candidates-loop flow closely.
