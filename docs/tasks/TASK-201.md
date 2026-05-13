## TASK-201: Implement arch report - auto-populate METRICS.md from archived task data
**Meta:** P2 | M | READY | Focus:yes | 2-code-generation | claude-code | cli/src/main/ts/, docs/METRICS.md, docs/archive/
**Depends:** none

### Context
Prerequisite: an XS event log task must be created to record REVIEW → READY status transitions before REVIEW_FAIL rate can be computed. If the event log is not yet available, implement everything else and emit a placeholder for REVIEW_FAIL rate.

### Acceptance Criteria
- [ ] Status transition event log: each REVIEW → READY transition appends a timestamped entry to `docs/EVENTS.md` → prose: verified by manually transitioning a task and checking EVENTS.md
- [ ] `arch report` command reads `docs/archive/` and computes: cycle time P50/P90 per size tier, cost per task by size and class, REVIEW_FAIL rate (from EVENTS.md) → cmd: arch report; exit: 0
- [ ] `arch report` writes a generated metrics block to `docs/METRICS.md` → cmd: test -f docs/METRICS.md; exit: 0
- [ ] THINK Phase 3 step 4 (Sprint Metrics) references `arch report` instead of manual computation → prose: verified by reading THINK.md
- [ ] `arch review` passes → cmd: arch review; exit: 0
- [ ] Tests pass → cmd: npm test --prefix cli; exit: 0

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
- [ ] `npm test` passes in `cli/`.
