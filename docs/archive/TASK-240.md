## TASK-240: Verbose fallback logging for provider switching
**Meta:** P2 | XS | DONE | Focus:yes | 2-code-generation | claude-code | cli/src/main/ts/application/use-cases/loop-engine.ts, cli/src/main/ts/application/commands/exec-command.ts | Closed-at: 2026-05-13T14:00:00Z
**Depends:** none

### Context
When the system falls back from a preferred provider to an alternative, the transition is silent or minimally logged. Users cannot tell why the primary provider failed or that a switch occurred.

### Acceptance Criteria
- [x] Fallback transition logs: which provider failed, why (error message), which provider is next
- [x] Color-coded output: yellow/warn for fallback transition
- [x] Full candidate list logged when `--verbose` flag is present
- [x] Error from failing provider clearly demarcated before "Trying next…" message

## Hansei
The `extraFlags` filter in exec-command previously passed `--verbose` through to the provider command. Fixed by filtering `--` prefixed args out. Should have been caught by a test — there's no test covering the `extraFlags` passthrough behavior.

