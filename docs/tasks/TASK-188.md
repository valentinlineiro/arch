## TASK-188: Document periodic architecture revision cycle in THINK protocol
**Meta:** P1 | S | READY | Focus:no | 6-writing | local | docs/agents/THINK.md
**Depends:** none

### Context
THINK runs on-demand but there is no scheduled revision guarantee. Without a periodic checkpoint, efficiency improvements happen ad-hoc or not at all. Documenting a periodic revision cycle in THINK.md ensures the system self-improves continuously without human triggering.

### Acceptance Criteria
- [ ] THINK.md Phase 3 documents a periodic revision cadence (bi-weekly recommended) that triggers a focused architecture audit independent of normal task execution
- [ ] The audit output format is specified: a numbered list of concrete streamlining proposals (not observations), each with a suggested next action (IDEA draft or direct fix)
- [ ] THINK.md references METRICS.md cost/turns data as the primary signal for identifying friction candidates
- [ ] `arch review` passes

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
