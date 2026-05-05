# IDEA: Universal LLM Bridge — OpenAI-Standard Adapter for CLIs and Native REST
**Created:** 2026-05-05
**Source:** User feedback — standardize on OpenAI API; provide adapters for Claude, Gemini, Codex, Opencode, and Ollama
**Status:** DRAFT
**Sessions:** 4
**Meta:** P1 | M | local | cli/src/main/ts/domain/services/llm-provider.ts, arch.config.json

## Problem
ARCH currently manages multiple integration patterns (CLI templates, subprocesses, specific API logic). As the number of supported models grows (Claude, Gemini, Codex, Opencode, Ollama), the complexity of maintaining individual integration logic and capturing metadata becomes unsustainable.

## Proposed solution
Standardize all ARCH LLM interactions on the **OpenAI API Standard**. Implement a **Universal LLM Bridge** that acts as a polymorphic adapter.

**1. OpenAI-Standard Adapter (The Bridge):**
A unified interface that exposes the standard OpenAI REST schema ( `/v1/chat/completions`). It handles routing to three underlying execution modes:

- **CLI-Wrapped Adapters:** For **Claude**, **Gemini**, **Codex**, and **Opencode**. The bridge spawns the respective official CLIs, parses their terminal output into a standard OpenAI-compatible JSON response, and extracts token usage data. This preserves the **zero-cost** benefit of using local CLI environments.
- **Native REST Adapters:** For **Ollama** and direct provider APIs. Since Ollama already exposes an OpenAI-compatible endpoint, the bridge acts as a simple pass-through/proxy.
- **Unified Metadata:** All responses, regardless of source (CLI or REST), return standardized `usage` objects (prompt_tokens, completion_tokens).

**2. Task Subsumption:**
This IDEA replaces and consolidates multiple specific integration tasks:
- **Subsumes OpenRouter:** OpenRouter becomes just another configuration entry in the OpenAI-standard routing table.
- **Subsumes individual CLI tweaks:** No more custom `sh -c` templates per task size.

## Configuration
`arch.config.json` uses a simplified provider registry:
```json
"providers": {
  "default": { "type": "bridge", "url": "http://localhost:8080/v1" },
  "routings": {
    "6-writing": { "model": "claude-3-5", "adapter": "cli-wrapped" },
    "2-code-generation": { "model": "gemini-1.5", "adapter": "cli-wrapped" },
    "local-dev": { "model": "codestral", "url": "http://localhost:11434/v1" }
  }
}
```

## Dependencies
- `IDEA-cost-aware-protocol`
- `TASK-191` (Conflict resolver)

## Estimated size
M

## Gaps
- **Parser Robustness:** Standardizing CLI output from various versions of Claude/Gemini into a rigid OpenAI JSON schema.
- **Function Calling:** Mapping OpenAI-style tool definitions to the target CLI's specific syntax (where supported).
- **Streaming:** Ensuring Server-Sent Events (SSE) work consistently across CLI-wrapped sources.

## Decision
PROMOTE → TASK-199
