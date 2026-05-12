## TASK-214: Fix exec/bridge layer: remove unused content param, add maxBuffer, fix local routing
**Meta:** P1 | XS | DONE | Focus:no | 9-bugfix | claude-code | cli/src/main/ts/domain/services/bridge-provider.ts, cli/src/main/ts/domain/services/sandbox.ts, cli/src/main/ts/application/commands/exec-command.ts, cli/src/main/ts/application/use-cases/loop-engine.ts
**Depends:** none

## Hansei
All three issues were silent regressions introduced when the unified provider strategy layer was assembled. The unused `content` param survived because callers consistently passed the content string even though it was ignored. The `maxBuffer` gap only manifests with large outputs, making it hard to catch in unit tests. Moving the `local` check inside the loop is a correctness fix that required reading the candidates-loop flow closely.
