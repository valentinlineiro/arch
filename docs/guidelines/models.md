# Model Usage Guidelines

To ensure consistent behavior across different LLM providers (Bridge vs. Native), follow these conventions for `arch.config.json`.

## Provider Types

### 1. Bridge Providers (CLI-based)
These providers wrap local CLIs like `claude` (Claude Code) or `gemini`.
- **Convention:** Use short **aliases** (e.g., `sonnet`, `opus`, `flash`).
- **Why:** Local CLIs often handle versioning internally or require specific alias-mapped flags.
- **Example:**
  ```json
  "2-code-generation": {
    "M": [
      { "provider": "claude-code", "model": "sonnet" }
    ]
  }
  ```

### 2. Native Providers (REST-based)
These providers communicate directly with APIs (OpenRouter, Anthropic, Ollama).
- **Convention:** Use **full model identifiers** (e.g., `anthropic/claude-3.5-sonnet`, `qwen2.5-coder:1.5b`).
- **Why:** REST APIs require exact identifiers to route requests correctly.
- **Example:**
  ```json
  "default": {
    "XS": [
      { "provider": "ollama", "model": "qwen2.5-coder:1.5b" }
    ]
  }
  ```

## Strategies Schema

The `arch.config.json` `strategies` object maps **task class** to **size tier** to an ordered list of `{provider, model}` fallback entries:

```json
"strategies": {
  "default": {
    "XS": [{"provider": "ollama", "model": "qwen2.5-coder:1.5b"}],
    "S":  [{"provider": "ollama", "model": "phi3:latest"}],
    "M":  [{"provider": "claude-code", "model": "sonnet"}],
    "L":  [{"provider": "claude-code", "model": "opus"}]
  },
  "2-code-generation": {
    "M": [{"provider": "claude-code", "model": "sonnet"}]
  },
  "1-code-reasoning": {
    "L": [{"provider": "claude-code", "model": "opus"}]
  }
}
```

## Current Configuration

As of ARCH v1.0.0, the recommended tiers for the `default` strategy are:
- **XS (Repetitive):** `qwen2.5-coder:1.5b` (Ollama)
- **S (Operations):** `phi3:latest` (Ollama)
- **M (Code/Reasoning):** `sonnet` (Gemini/Claude Bridge)
- **L (Strategy):** `opus` (Claude Bridge)

## Troubleshooting

If a provider fails with "Model not found":
1. Check if the CLI supports the alias (run `claude --help` or `gemini --help`).
2. Verify that the native endpoint (like Ollama) has the model downloaded (`ollama list`).
