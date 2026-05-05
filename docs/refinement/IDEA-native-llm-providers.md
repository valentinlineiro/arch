# IDEA: Hybrid LLM Providers — CLI-to-REST Bridge and Native Providers
**Created:** 2026-05-05
**Source:** User feedback — wrap CLI calls under a REST adapter to decouple execution and metadata
**Status:** DRAFT
**Sessions:** 3
**Meta:** P1 | M | local | cli/src/main/ts/domain/services/llm-provider.ts, arch.config.json

## Problem
ARCH needs a unified way to interact with AI agents that preserves the cost benefits of official CLIs while gaining the metadata visibility (tokens, cost, latency) of native REST APIs. Directly spawning subprocesses in the main loop is performance-heavy and makes metadata capture difficult.

## Proposed solution
Implement a **Unified Provider Interface** with three distinct execution strategies:

**1. CLI-to-REST Bridge (Sidecar Mode):**
A local "adapter" service that provides a standard OpenAI-compatible REST API but executes local CLI commands (e.g., `claude`, `gemini`) under the hood.
- **Decoupling:** ARCH CLI talks HTTP to the bridge. The bridge manages the subprocess, shell environment, and output parsing.
- **Metadata Persistence:** The bridge parses CLI output and returns a structured JSON response (including usage metrics) to ARCH.
- **Cost Neutral:** Uses the user's existing CLI auth/billing, adding zero direct API costs.
- **Async Ready:** Allows the bridge to handle long-running generation or queuing without blocking the ARCH main loop.

**2. Native REST (Direct Mode):**
Direct HTTP integration for high-performance providers (Anthropic, Google, OpenRouter).
- **Zero Latency:** No subprocess overhead.
- **Fidelity:** Native usage metrics and reasoning headers.

**3. Integrated CLI Wrapper (Embedded Mode):**
The current `sh -c` approach, but upgraded with specialized parsers for `claude` and `gemini` output to capture usage data in-process.

## Configuration
`arch.config.json` routes tasks based on priority and cost constraints:
```json
"providers": {
  "claude-3-5": {
    "strategy": "bridge",
    "bridgeUrl": "http://localhost:8080/v1",
    "cli": "claude",
    "fallback": "native-rest"
  }
}
```

## Dependencies
- `IDEA-cost-aware-protocol`
- `TASK-191` (Conflict resolver)

## Estimated size
M

## Gaps
- **Bridge Lifecycle:** Does ARCH start/stop the bridge automatically, or is it a persistent background service?
- **Universal Parser:** Creating a robust parser for CLI output that handles streaming artifacts and escape codes.
- **Overhead vs. Benefit:** Does the HTTP overhead of the bridge cancel out the benefits of decoupling?
- **Security:** Securing the local bridge endpoint to prevent other local processes from "stealing" AI access.

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
