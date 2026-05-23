## TASK-966: Implement THINK-generated promotion proposals: when IDEA ent
**Meta:** P2 | M | DONE | Focus:false | 2-code-generation | local | docs/tasks/
**Closed-at:** 2026-05-23T17:47:51.287Z
**Depends:** none

## Hansei
**Severity:** H0
**Category:** [SpecDrift]
**Decision:** Promotion proposal generation implemented as advisory THINK mode output — model, generator service, and analyze-command wiring completed. ACs updated from skeleton placeholders to domain-specific predicates.
**Constraint:** New domain model file falls under protected paths — no existing ADR covers promotion proposals; speculative alignment with ADR-017 observability patterns.
**Cost:** No cost incurred — all models local, no LLM calls for proposal generation.
**Forward Action:** Wire into arch promote command to consume proposals as a follow-up integration task.
