## TASK-213: Unify routing and model tiers into a single strategy configuration
**Meta:** P0 | M | DONE | Focus:no | 2-code-generation | local | arch.config.json
**Closed-at: 2026-05-06T11:45:00.000Z**

### Context
Currently, AI invocation logic is split between `routing` (by class) and `modelTiers` (by size/provider). This is redundant and makes configuration harder to maintain. Consolidating both into a unified `strategies` section will provide a single source of truth for task execution logic.

### Acceptance Criteria
- [x] Implement `strategies` lookup in `ProviderRegistry`
- [x] `strategies` must support `class -> size -> [{ provider, model }]` mapping
- [x] Support a `default` class and `default` size fallback within the `strategies` object
- [x] Refactor `arch.config.json` to the new `strategies` format
- [x] Remove `routing` and `modelTiers` from `arch.config.json`
- [x] Update `ProviderRegistry.resolveAll` to follow the new strategy arrays
- [x] Ensure backward compatibility for any existing code still calling `resolve()`
- [x] All CLI tests pass
- [x] `arch review` passes

## Hansei
The unification of routing and tiers into hierarchical strategies is a major architectural improvement. It eliminates the "dual-entry" maintenance problem and makes the fallback logic explicit rather than derived. The 4-level hierarchical lookup (Specific/Specific -> Specific/Default -> Default/Specific -> Default/Default) ensures that the system always has a sane execution policy while allowing surgical overrides when needed. Creating ADR-011 documented this shift and satisfied the EscalationMaturity protocol for protected path modifications.
