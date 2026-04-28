## TASK-033: Refinement-first flow for "idea:" intent in DO
**Meta:** P1 | S | 5 | DONE | Sprint 3 | 6-writing | claude | docs/agents/DO.md
**Depends:** none

### Acceptance Criteria
- [x] DO.md updated: when Human intent contains `"idea:"`, create a draft in `docs/refinement/` and stop — no task created
- [x] Draft filename: `IDEA-<slug>.md` derived from the idea text
- [x] Draft template includes: Problem, Proposed solution, Dependencies, Estimated size
- [x] DO.md documents that promoting a draft to backlog requires explicit human instruction
- [x] `docs/refinement/` directory created with a `.gitkeep`

### Definition of Done
- [x] DO.md updated and validated
- [x] Template documented in `docs/refinement/TEMPLATE.md`
- [x] PR approved
