## TASK-213: Unify routing and model tiers into a single strategy configuration
**Meta:** P0 | M | DONE | Focus:no | 2-code-generation | local | arch.config.json

## Hansei
The unification of routing and tiers into hierarchical strategies is a major architectural improvement. It eliminates the "dual-entry" maintenance problem and makes the fallback logic explicit rather than derived. The 4-level hierarchical lookup (Specific/Specific -> Specific/Default -> Default/Specific -> Default/Default) ensures that the system always has a sane execution policy while allowing surgical overrides when needed. Creating ADR-011 documented this shift and satisfied the EscalationMaturity protocol for protected path modifications.
