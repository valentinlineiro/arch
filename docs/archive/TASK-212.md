## TASK-212: Implement provider-aware model mapping for fallback mechanism
**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | local | arch.config.json

## Hansei
This change completes the robustness of the Universal LLM Bridge by ensuring that "provider-speak" (model identifiers) is correctly scoped to each engine. The removal of the "default" model concept prevents the accidental leakage of provider-specific names (like Claude's "sonnet") into other providers (like Ollama). Scoping the fallback candidates to only those explicitly configured for a tier adds a layer of safety and administrative control.
