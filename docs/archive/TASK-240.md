## TASK-240: Verbose fallback logging for provider switching
**Meta:** P2 | XS | DONE | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/application/use-cases/loop-engine.ts, cli/src/main/ts/application/commands/exec-command.ts | Closed-at: 2026-05-13T14:00:00Z
**Depends:** none

## Hansei
The `extraFlags` filter in exec-command previously passed `--verbose` through to the provider command. Fixed by filtering `--` prefixed args out. Should have been caught by a test — there's no test covering the `extraFlags` passthrough behavior.
