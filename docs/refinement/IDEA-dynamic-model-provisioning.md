# IDEA: dynamic-model-provisioning
**Created:** 2026-05-06
**Source:** User request "idea: run llm-checker in local and select the best models fitting the machine. If we are in cloud, we need to replace them for free alternatives performing similar"
**Status:** DRAFT
**Meta:** P2 | M | local | arch.config.json, cli/src/main/ts/domain/services/
<!-- cli: local | claude | gemini | human -->

## Problem
Currently, `modelTiers` in `arch.config.json` are static. This leads to friction when moving between machines (e.g., a local workstation with GPU vs. a cloud runner vs. a laptop). Users have to manually update the config, or agents run with suboptimal models for the available hardware.

## Proposed solution
1.  **Local Discovery:** Integrate `llm-checker` (or equivalent logic) into `arch setup` or `arch govern`. If `llm-checker` is present, use its recommendations to dynamically update/override local `modelTiers`.
2.  **Environment Awareness:** Detect "Cloud" vs "Local" environments.
    *   **Local:** Use GPU-optimized Ollama models recommended by `llm-checker`.
    *   **Cloud (CI/GitHub Actions):** Default to free-tier API providers (e.g., Groq, OpenRouter free models, or Gemini Flash) that offer similar performance levels for XS/S tasks without requiring a GPU.
3.  **Config Schema Update:** Support environment-specific overrides in `arch.config.json`.
    ```json
    "modelTiers": {
      "local": { "XS": "qwen3:1.7b", "S": "qwen2.5:7b-instruct-q2_K" },
      "cloud": { "XS": "gemini-1.5-flash", "S": "groq:llama3-8b" }
    }
    ```

## Dependencies
IDEA-openrouter-groq-free-tier-fallback (Pending)

## Estimated size
M

## Gaps
<!-- THINK fills this section when invoked — do not edit manually -->

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
