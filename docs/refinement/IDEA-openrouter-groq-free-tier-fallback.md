# IDEA: allow-openrouter-groq-fallbacks
**Created:** 2026-04-29
**Source:** human feedback
**Status:** DRAFT
**Meta:** P3 | S | gemini | cli/, docs/agents/
<!-- cli: local | claude | gemini | human -->

## Problem
ARCH currently relies heavily on specific local CLIs (gemini, claude). If these are not installed, configured, or have exhausted their quotas, the agent loop stalls. While there is a fallback to "showing the protocol" (text output), it doesn't allow for continued autonomous operation.

## Proposed solution
Integrate OpenRouter and Groq APIs as fallback providers.
- If primary CLIs fail, the system can attempt to use OpenRouter or Groq (which offer significant free tiers for models like Llama 3 or Mixtral).
- This would likely require a generic `arch-api-cli` or similar lightweight wrapper that can handle standard OpenAI-compatible API calls.
- Configuration would live in `arch.config.json` under an `alternativeProviders` or similar section.

## Dependencies
- TASK-128 (Fix arch conduct to use CLI) — provides the foundation for routing through CLIs.

## Estimated size
S

## Gaps
<!-- THINK fills this section when invoked — do not edit manually -->

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
