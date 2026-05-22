## TASK-996: Rely on opencode when gemini is exhausted for LLM assistance
**Meta:** P3 | S | READY | Focus:no | 2-code-generation | local | cli/src/main/ts/application/commands/analyze-command.ts

### Acceptance Criteria
- [ ] Rely on opencode when gemini is exhausted for LLM assistance

### Context
#### Problem
`arch analyze` (THINK mode) invokes the Gemini CLI as its LLM advisory channel. When Gemini quota is exhausted (429 rate-limit or capacity errors), the advisory analysis fails silently or with a stack trace. The system has no fallback to another available CLI — opencode is installed and available but never tried.

The root cause: `analyze-command.ts` lines 329–346 iterate over `clis` from config but call `process.exit(0)` immediately after the first CLI runs — regardless of whether it succeeded or failed. If Gemini returns non-zero (quota exhausted), the error is printed but execution never falls through to the next CLI.

#### Solution
`analyze-command.ts` line 336 (`spawnSync(...)`) currently ignores the exit status. Change the loop to check `result.status`:
- If 0 (success): keep current behavior (`process.exit(0)`).
- If non-zero (failure): log the failure, continue to the next CLI in the `clis` array.

opencode is already registered in `arch.config.json` (`clis[?].name == "opencode"`, `providers[?].name == "opencode"`) and also has `"template": "opencode \"{prompt}\""`. No config change needed — the template works. The CLI listing will try gemini first, then opencode, then fall through to claude/ollama.

A potential refinement: add `exit 0` to the opencode template so it doesn't fail on non-zero exit from the inner command: `"opencode \"{prompt}\" ; exit 0"`.

### Definition of Done
- [ ] All ACs checked.
- [ ] arch review passes.
