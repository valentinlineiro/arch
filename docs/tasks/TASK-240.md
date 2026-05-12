## TASK-240: Verbose fallback logging for provider switching
**Meta:** P2 | XS | READY | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/application/use-cases/loop-engine.ts, cli/src/main/ts/application/commands/exec-command.ts
**Depends:** none

### Context
When the system falls back from a preferred provider to an alternative, the transition is silent or minimally logged. Users cannot tell why the primary provider failed or that a switch occurred.

### Acceptance Criteria
- [ ] Fallback transition logs: which provider failed, why (error message), which provider is next
- [ ] Color-coded output: yellow/warn for fallback transition
- [ ] Full candidate list logged when `--verbose` flag is present
- [ ] Error from failing provider clearly demarcated before "Trying next…" message
