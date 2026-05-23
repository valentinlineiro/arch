## TASK-211: Implement tiered provider fallback mechanism
**Meta:** P1 | M | DONE | Focus:no | 2-code-generation | local | arch.config.json

## Hansei
The fallback mechanism significantly increases the system's resilience. By removing the strict type pairing (Bridge-only or Native-only fallback), we now allow the system to use whatever is available. The "On Any Error" strategy is simple and effective for this stage, as it covers quota, network, and CLI-specific failures without complex error parsing.

## Approval
Approved-by: human | 2026-05-23
Notes: Retroactive approval — M task closed without Approval section.
