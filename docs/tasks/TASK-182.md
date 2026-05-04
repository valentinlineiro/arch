## TASK-182: Add Turns field to task meta and Mura detection to THINK
**Meta:** P2 | S | REVIEW | Focus:yes | 6-writing | local | docs/TASK-FORMAT.md, docs/agents/THINK.md, docs/METRICS.md
**Depends:** TASK-178

### Context
METRICS.md tracks task count and cycle time but not execution depth per size tier. An S task taking 40 turns is a Mura (unevenness) signal — the size estimate was wrong or the task was underspecified — but this goes undetected today. Depends on TASK-178 (Hansei close step) since both enrich the same task close step.

### Acceptance Criteria
- [x] `TASK-FORMAT.md` documents optional `Turns: N` field appended to Meta line at close
- [x] "Turn" defined precisely: one full agent request/response cycle
- [x] METRICS.md sprint template includes a Turns-per-Size table (XS/S/M/L with expected ranges)
- [x] THINK.md Phase 3 reads Turns from last 10 archived tasks and flags `[MURA]` when actual avg exceeds expected by >50%

### Definition of Done
- [x] `arch review` passes
