## TASK-149: Restrict THINK scope - formalize CLI/AI layer boundary in THINK.md
**Meta:** P2 | S | DONE | Focus:no | 6-writing | local | docs/agents/THINK.md, arch.config.json
**Sprint:** sprint/v0.7-foundations
**Depends:** TASK-147

### Acceptance Criteria
- [x] Add a scope declaration to THINK.md: "THINK is the AI reasoning layer. It handles work requiring judgment, pattern recognition, or architectural insight. It does not re-implement logic the CLI can execute deterministically."
- [x] Define the escalation path for `arch govern` edge cases: if govern cannot select a task (all READY tasks blocked), it must exit with a specific signal that THINK interprets as a prompt for AI intervention.
- [x] `arch review` passes.

### Definition of Done
- [x] All ACs checked.
- [x] `arch review` passes.
