## TASK-033: Refinement-first flow for "idea:" intent in DO
**Meta:** P1 | S | READY | Sprint 3 | 6-writing | claude | docs/agents/DO.md
**Depends:** none

### Acceptance Criteria
- [ ] DO.md updated: when Human intent contains `"idea:"`, create a draft in `docs/refinement/` and stop — no task created
- [ ] Draft filename: `IDEA-<slug>.md` derived from the idea text
- [ ] Draft template includes: Problema, Solución propuesta, Dependencias, Tamaño estimado
- [ ] DO.md documents that promoting a draft to backlog requires explicit human instruction
- [ ] `docs/refinement/` directory created with a `.gitkeep`

### Definition of Done
- [ ] DO.md updated and validated
- [ ] Template documented in `docs/refinement/TEMPLATE.md`
- [ ] PR approved
