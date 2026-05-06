# IDEA: Unify routing and model tiers into a single strategy configuration
**Created:** 2026-05-06
**Source:** User suggestion to eliminate redundancy between routing and tiers.
**Status:** DRAFT
**Meta:** P1 | S | cli | arch.config.json

## Problem
Currently, `arch.config.json` splits AI invocation logic across two sections:
1. `routing`: Determines the preferred provider based on the task **class**.
2. `modelTiers`: Determines the model identifier based on the task **size** and provider name.

This leads to redundancy and cognitive load. A developer must update two different tables to change how a specific type of task is executed.

## Proposed solution
Consolidate both into a single `strategies` or `policies` section that uses a hierarchical lookup.

### Example Unified Structure:
```json
"strategies": {
  "2-code-generation": {
    "M": [
      { "provider": "claude-code", "model": "sonnet" },
      { "provider": "gemini", "model": "sonnet" },
      { "provider": "ollama", "model": "qwen2.5-coder:7b" }
    ],
    "S": [
      { "provider": "gemini", "model": "flash" },
      { "provider": "ollama", "model": "phi3:latest" }
    ]
  },
  "default": {
    "XS": [
      { "provider": "ollama", "model": "qwen2.5-coder:1.5b" }
    ]
  }
}
```

### Benefits:
1. **Locality:** All logic for "how to run a Medium code generation task" is in one array.
2. **Explicit Fallbacks:** The order of the array explicitly defines the fallback chain for that specific context.
3. **Flexibility:** Different task classes can have completely different fallback chains and model selections.

## Dependencies
- TASK-212 (Completed: Provider-aware models)
- TASK-211 (Completed: Fallback mechanism)

## Estimated size
S

## Gaps
<!-- THINK fills this section when invoked — do not edit manually -->

## Decision
PROMOTE → TASK-213
