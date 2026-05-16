## TASK-210: Fix model parameter propagation in LoopEngine and BridgeProvider
**Meta:** P0 | S | DONE | Focus:no | 9-bugfix | local | arch.config.json

## Approval
Approved-by: Auditor | 2026-05-16

## Hansei
The root cause was an oversight during the implementation of the Universal LLM Bridge where provider-specific flag logic and native request payloads were not fully generalized. This bug was caught when switching from Claude to Gemini due to quota limits, which exposed the missing flag propagation for Gemini. Standardizing the naming convention (aliases for CLI, full IDs for REST) will prevent future drift.
