# IDEA: Native LLM Providers — Replace subprocess CLIs with direct REST API integration
**Created:** 2026-05-05
**Source:** User feedback — remove subprocess overhead and enable direct metadata capture
**Status:** DRAFT
**Meta:** P1 | M | local | cli/src/main/ts/domain/services/llm-provider.ts, arch.config.json

## Problem
ARCH currently invokes AI agents by spawning subprocesses (e.g., `claude`, `gemini`). This creates several points of friction:
1. **Performance:** Subprocess startup and shell interpolation add latency to every loop turn.
2. **Metadata Blindness:** The CLI cannot access token counts, reasoning tokens, or provider-specific headers without brittle terminal scraping.
3. **Environment Complexity:** Users must have specific CLIs installed and configured in their PATH.
4. **Reliability:** Escape sequences and shell-specific behavior (e.g., `.npmrc` or `.zshrc` interference) can break the communication channel.

## Proposed solution
Implement a native `LLMProvider` interface in the ARCH CLI and provide direct REST implementations for major providers.

**1. Configuration Change:**
Update `arch.config.json` to support direct provider configuration:
```json
"providers": {
  "anthropic": { "apiKeyEnv": "ANTHROPIC_API_KEY", "defaultModel": "claude-3-5-sonnet-latest" },
  "google": { "apiKeyEnv": "GOOGLE_API_KEY", "defaultModel": "gemini-1.5-pro" },
  "ollama": { "baseUrl": "http://localhost:11434" }
}
```

**2. Domain Layer:**
Introduce `LLMProvider` interface with a unified `generate(prompt, options)` method that returns both the response text and a `Usage` object (tokens, cost, latency).

**3. Application Layer:**
Update `ExecCommand` and `LoopEngine` to use the `LLMProvider` directly when a provider is configured, falling back to `clis` (subprocess) only if explicitly requested for legacy support.

**4. Metrics Integration:**
Directly pipe token usage metadata into `METRICS.md` and the `Cost:` field of tasks, fulfilling the prerequisites for `IDEA-cost-aware-protocol`.

## Dependencies
- `IDEA-cost-aware-protocol` (Direct consumer of metadata)
- `TASK-191` (Conflict resolver — higher turn frequency makes latency more noticeable)

## Estimated size
M

## Gaps
- **Model Routing:** How to handle "agent-specific features" (e.g., Claude's computer use or Gemini's large context caching) in a unified interface?
- **Auth Security:** Ensuring API keys are never logged even in `verbose` mode; integration with system keychains vs environment variables.
- **Streaming Handlers:** Implementation of a streaming-to-terminal handler that matches current CLI behavior while capturing chunk-level metadata.
- **Error Mapping:** Normalizing provider-specific errors (rate limits, safety filters, overloaded) into ARCH-standard `ANDON_HALT` conditions.
- **Loop Integration:** How to hot-swap between subprocess and native providers without breaking the `arch loop` state machine.

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
