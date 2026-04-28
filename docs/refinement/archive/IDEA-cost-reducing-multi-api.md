# IDEA: Real cost reduction via multi-API routing
**Created:** 2026-04-28
**Source:** Human request — reduce actual monetary cost of running ARCH across AI providers
**Status:** PROMOTED → TASK-103, TASK-104
**Meta:** P1 | M | 7-operations | arch.config.json, scripts/arch.sh, docs/agents/

## Problem
Every ARCH operation (conduct, exec) routes to a single AI CLI regardless of the nature of the work. High-capability (expensive) models are used for tasks that don't require them — e.g., running THINK's system check or writing a XS doc task costs the same as implementing complex code. There is no cost-awareness in the routing layer.

## Proposed solution
Extend `arch.config.json` routing to assign each operation class to the cheapest API capable of doing it reliably:

```json
"routing": {
  "1-code-reasoning":   "claude",    // needs strong reasoning
  "2-code-generation":  "claude",    // needs strong generation
  "3-code-context":     "gemini",    // large context window, cheaper
  "4-code-repetitive":  "local",     // free (ollama/codestral)
  "5-research":         "gemini",    // cheaper for reading/summarizing
  "6-writing":          "gemini",    // cheaper for prose
  "7-operations":       "local",     // shell scripts, no LLM needed
  "8-strategy":         "claude"     // needs best reasoning
}
```

Additional levers:
- **Model tier within a provider**: use `claude-haiku` for XS tasks, `claude-sonnet` for S/M, `claude-opus` only for L/XL or P0.
- **Caching**: enable prompt caching for THINK mode (THINK.md system prompt is static — cache hit on every conduct run).
- **Batch API**: queue non-urgent XS writing tasks and submit as a batch (50% cost reduction on Anthropic Batch API).

The CLI registry (TASK-086) provides the hook: each CLI entry can include a `model` override and a `tier` field mapped to task size.

## Dependencies
- TASK-086 (pluggable CLI registry) — model/tier fields extend that schema.

## Estimated size
M

## Gaps
<!-- THINK fills this section when invoked — do not edit manually -->

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
