## TASK-211: Implement tiered provider fallback mechanism
**Meta:** P1 | M | DONE | Focus:no | 2-code-generation | local | arch.config.json
**Closed-at: 2026-05-06T11:15:00.000Z**

### Context
When a primary LLM provider is exhausted (quota) or fails (network), the system should automatically fall back to alternative providers rather than halting. This ensures continuous operation in the autonomous loop and a better user experience for manual commands.

### Acceptance Criteria
- [x] Implement `ProviderRegistry.resolveAll()` to return an ordered list of all suitable candidates
- [x] Remove `preferredType` restriction to allow falling back between Bridge and Native providers
- [x] Update `LoopEngine` to iterate through candidates and fall back on any execution error
- [x] Update `ExecCommand` to iterate through candidates and fall back on any execution error
- [x] Add unit tests for `resolveAll()` and fallback ordering
- [x] Empirically verify fallback from Claude Code (quota exhausted) to Gemini CLI

## Hansei
The fallback mechanism significantly increases the system's resilience. By removing the strict type pairing (Bridge-only or Native-only fallback), we now allow the system to use whatever is available. The "On Any Error" strategy is simple and effective for this stage, as it covers quota, network, and CLI-specific failures without complex error parsing.
