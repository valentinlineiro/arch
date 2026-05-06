## TASK-212: Implement provider-aware model mapping for fallback mechanism
**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | local | arch.config.json
**Closed-at: 2026-05-06T11:25:00.000Z**

### Context
Following the implementation of the tiered fallback mechanism, a bug was identified where model names (e.g., "sonnet") were being applied globally across all fallback providers, regardless of whether those providers understood the name. The system now supports explicit, provider-specific model mappings within each task tier.

### Acceptance Criteria
- [x] Update `ProviderRegistry.resolveModel` to support nested, provider-specific object mappings
- [x] Update `ProviderRegistry.resolveAll` to resolve models per candidate and filter out candidates without explicit mappings in object-based tiers
- [x] Refactor `arch.config.json` to use the new nested model structure across all tiers (XS, S, M, L)
- [x] Add unit tests verifying specific model resolution and candidate filtering
- [x] All 143 CLI tests pass

## Hansei
This change completes the robustness of the Universal LLM Bridge by ensuring that "provider-speak" (model identifiers) is correctly scoped to each engine. The removal of the "default" model concept prevents the accidental leakage of provider-specific names (like Claude's "sonnet") into other providers (like Ollama). Scoping the fallback candidates to only those explicitly configured for a tier adds a layer of safety and administrative control.
