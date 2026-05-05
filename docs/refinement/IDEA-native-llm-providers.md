# IDEA: Hybrid LLM Providers — Optimized CLI wrapping with optional Native REST
**Created:** 2026-05-05
**Source:** User feedback — prioritize low-cost CLI usage while improving metadata capture
**Status:** DRAFT
**Sessions:** 2
**Meta:** P1 | M | local | cli/src/main/ts/domain/services/llm-provider.ts, arch.config.json

## Problem
Directly using REST APIs via keys often incurs direct financial costs (e.g., Anthropic API billing) or lower rate limits compared to the provider's official CLIs which may leverage different billing tiers or "free-to-use" developer environments. However, pure subprocess execution makes ARCH "blind" to performance and usage metrics.

## Proposed solution
Implement a **Hybrid Provider Architecture** that treats both CLIs and REST APIs as first-class implementations of a unified `LLMProvider` interface.

**1. Optimized CLI Wrappers (Default):**
Instead of a generic `sh -c` template, implement specialized wrappers for `claude`, `gemini`, and `ollama`.
- **Metadata Scraping:** Each wrapper includes a parser to extract token counts or timing data from the CLI's specific output format.
- **Cost Preservation:** Continues to use existing CLI auth/billing channels, ensuring zero cost increase for the user.

**2. Native REST (High-Fidelity):**
Optional providers for users who prioritize speed and metadata precision (e.g., OpenRouter, Anthropic Direct, Google AI Studio).
- **Latency reduction:** Eliminates subprocess overhead.
- **Rich Metadata:** Captures exact token usage directly from the JSON response.

**3. Automatic Routing:**
`arch.config.json` allows defining a fallback chain:
```json
"providers": {
  "claude-3-5": [
    { "type": "cli", "bin": "claude", "parseMetadata": true },
    { "type": "rest", "id": "anthropic-native", "costGate": "high" }
  ]
}
```

## Dependencies
- `IDEA-cost-aware-protocol` (Uses metadata to warn on high-cost API routing)
- `TASK-191` (Conflict resolver)

## Estimated size
M

## Gaps
- **Parser Brittleness:** Official CLI output formats are not guaranteed to be stable (e.g., `claude` updates might break our token scraper).
- **Auth Parity:** Managing credentials for both CLIs and REST keys in a single secure context.
- **Local Fallbacks:** Ensuring `ollama` (free/local) is the default high-turn fallback for non-complex tasks.

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
