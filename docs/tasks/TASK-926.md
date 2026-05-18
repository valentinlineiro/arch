## TASK-926: Fix metrics engine integrity breach due to duplicate DONE events
**Meta:** P1 | S | IN_PROGRESS | Focus:yes | 2-code-generation | claude | docs/EVENTS.md, cli/src/main/ts/application/commands/report-command.ts

### Context

`arch report` failed with a `CRITICAL INTEGRITY BREACH` because `docs/EVENTS.md` contains duplicate `DONE -> DONE` transitions for several tasks (TASK-207, TASK-231, TASK-234, TASK-235, TASK-236, TASK-237). 

The metrics engine expects a linear state machine transition. Duplicate archival events corrupt the cycle-time and throughput calculations.

### Acceptance Criteria

- [ ] `docs/EVENTS.md` is cleaned up: duplicate `DONE -> DONE` lines are removed.
- [ ] `arch report` passes without `INTEGRITY BREACH` warning.
- [ ] Metrics engine is hardened to handle duplicate events gracefully (e.g. use only the first `DONE` event for a task) if they ever recur.
- [ ] `arch review` passes.

### Definition of Done
- [ ] `arch report` works.
- [ ] `arch review` passes.
