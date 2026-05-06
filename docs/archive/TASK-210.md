## TASK-210: Fix model parameter propagation in LoopEngine and BridgeProvider
**Meta:** P0 | S | DONE | Focus:no | 9-bugfix | local | arch.config.json
**Closed-at: 2026-05-06T10:55:00.000Z**

### Context
The `arch` loop was failing to pass model parameters correctly to providers. Specifically:
1. `LoopEngine` was not passing the `model` identifier to the `NativeProvider`.
2. `BridgeProvider` only supported the `--model` flag for the `claude` CLI, causing failures when using `gemini` in bridge mode.

### Acceptance Criteria
- [x] Fix `LoopEngine` to propagate model to `NativeProvider.complete`
- [x] Fix `BridgeProvider` to support `--model` flag for `gemini` CLI
- [x] Create `docs/guidelines/models.md` to clarify Bridge vs. Native model naming conventions
- [x] Update `GEMINI.md` to reference the new guidelines
- [x] All 140 CLI tests pass

## Hansei
The root cause was an oversight during the implementation of the Universal LLM Bridge where provider-specific flag logic and native request payloads were not fully generalized. This bug was caught when switching from Claude to Gemini due to quota limits, which exposed the missing flag propagation for Gemini. Standardizing the naming convention (aliases for CLI, full IDs for REST) will prevent future drift.
