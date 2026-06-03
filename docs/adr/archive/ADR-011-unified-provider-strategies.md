# ADR-011: Unified Provider Strategies

## Status
ACCEPTED

## Context
As the Universal LLM Bridge (TASK-199) and the Fallback Mechanism (TASK-211) were implemented, the configuration logic became fragmented. AI invocation was controlled by two separate and redundant tables in `arch.config.json`:
1. `routing`: Mapped task **class** to a preferred provider.
2. `modelTiers`: Mapped task **size** to provider-specific model strings.

This fragmentation led to bugs (global model names leaking across providers) and significant redundancy when defining fallback chains.

## Decision
Consolidate all AI invocation logic into a single, hierarchical `strategies` configuration.

### New Configuration Schema:
```json
"strategies": {
  "<class>": {
    "<size>": [
      { "provider": "<name>", "model": "<identifier>" }
    ],
    "default": [...] 
  },
  "default": {
    "default": [...]
  }
}
```

### Key Changes:
1. **Locality:** A single array now defines both the provider and the model, as well as the explicit fallback order for a specific (Class, Size) context.
2. **Hierarchical Lookup:** The system resolves strategies using a 4-level fallback:
   - Specific Class + Specific Size
   - Specific Class + `default` Size
   - `default` Class + Specific Size
   - `default` Class + `default` Size
3. **Removal of Redundancy:** The `routing` and `modelTiers` sections are removed.

## Consequences
- **Configuration Clarity:** All "Execution Policies" are now defined in one place.
- **Improved Fallback:** Fallback chains are now context-aware (different classes can have different fallback priorities).
- **Breaking Change:** Existing `arch.config.json` files must be migrated to the new schema. Backward compatibility is maintained in the code via `resolveAllLegacy` for unmigrated configs.
