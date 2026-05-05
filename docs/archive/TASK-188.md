## TASK-188: Document periodic architecture revision cycle in THINK protocol
**Meta:** P1 | S | DONE | Focus:no | 6-writing | local | docs/agents/THINK.md
**Closed-at:** 2026-05-05T09:47:41.652Z
**Depends:** none

### Context
THINK runs on-demand but there is no scheduled revision guarantee. Without a periodic checkpoint, efficiency improvements happen ad-hoc or not at all. Documenting a periodic revision cycle in THINK.md ensures the system self-improves continuously without human triggering.

### Acceptance Criteria
- [x] THINK.md Phase 3 documents a periodic revision cadence (bi-weekly recommended) that triggers a focused architecture audit independent of normal task execution
- [x] The audit output format is specified: a numbered list of concrete streamlining proposals (not observations), each with a suggested next action (IDEA draft or direct fix)
- [x] THINK.md references METRICS.md cost/turns data as the primary signal for identifying friction candidates
- [x] `arch review` passes

### Definition of Done
- [x] All ACs checked.
- [x] `arch review` passes.
