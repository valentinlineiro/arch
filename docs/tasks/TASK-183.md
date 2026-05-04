## TASK-183: Add OpenRouter/Groq as fallback CLI providers in ExecCommand
**Meta:** P3 | S | READY | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/application/commands/exec-command.ts, arch.config.json
**Depends:** none

### Context
When primary CLIs (claude, gemini) are unavailable or quota-exhausted, the loop stalls. ExecCommand (TASK-175) already has a typed CLI fallback chain — adding OpenRouter/Groq as additional entries is now straightforward. Both offer OpenAI-compatible APIs with free tiers.

### Acceptance Criteria
- [ ] `arch.config.json` schema supports an `openrouter` and `groq` CLI entry with `apiKey` sourced from env var
- [ ] ExecCommand routing falls back to OpenRouter/Groq when preferred CLIs are unavailable (consistent with existing fallback order)
- [ ] A lightweight CLI wrapper (`arch-api-call` or inline `node` invocation) handles the OpenAI-compatible API call with the prompt file content
- [ ] Configuration documented in README or `docs/guidelines/resources.md`

### Definition of Done
- [ ] `arch review` passes
- [ ] `npm test` passes in `cli/`
