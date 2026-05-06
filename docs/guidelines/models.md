# Model Usage Guidelines

To ensure consistent behavior across different LLM providers (Bridge vs. Native), follow these conventions for `arch.config.json`.

## Provider Types

### 1. Bridge Providers (CLI-based)
These providers wrap local CLIs like `claude` (Claude Code) or `gemini`.
- **Convention:** Use short **aliases** (e.g., `sonnet`, `opus`, `flash`).
- **Why:** Local CLIs often handle versioning internally or require specific alias-mapped flags.
- **Example:**
  ```json
  "modelTiers": {
    "M": "sonnet"
  }
  ```

### 2. Native Providers (REST-based)
These providers communicate directly with APIs (OpenRouter, Anthropic, Ollama).
- **Convention:** Use **full model identifiers** (e.g., `anthropic/claude-3.5-sonnet`, `qwen2.5-coder:1.5b`).
- **Why:** REST APIs require exact identifiers to route requests correctly.
- **Example:**
  ```json
  "modelTiers": {
    "XS": "qwen2.5-coder:1.5b"
  }
  ```

## Current Configuration
As of ARCH v0.6.0, the recommended tiers are:
- **XS (Repetitive):** `qwen2.5-coder:1.5b` (Ollama)
- **S (Operations):** `phi3:latest` (Ollama)
- **M (Code/Reasoning):** `sonnet` (Gemini/Claude Bridge)
- **L (Strategy):** `opus` (Claude Bridge)

## Troubleshooting
If a provider fails with "Model not found":
1. Check if the CLI supports the alias (run `claude --help` or `gemini --help`).
2. Verify that the native endpoint (like Ollama) has the model downloaded (`ollama list`).
