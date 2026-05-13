## TASK-201: Implement arch report - auto-populate METRICS.md from archived task data
**Meta:** P2 | M | REVIEW | Focus:yes | 2-code-generation | claude-code | cli/src/main/ts/, docs/METRICS.md, docs/archive/
**Depends:** none

### Context
Prerequisite: an XS event log task must be created to record REVIEW → READY status transitions before REVIEW_FAIL rate can be computed. If the event log is not yet available, implement everything else and emit a placeholder for REVIEW_FAIL rate.

Implements: ADR-017

### Acceptance Criteria
- [x] Status transition event log: each REVIEW → READY transition appends a timestamped entry to `docs/EVENTS.md` → prose: verified by manually transitioning a task and checking EVENTS.md
- [x] `arch report` command reads `docs/archive/` and computes: cycle time P50/P90 per size tier, cost per task by size and class, REVIEW_FAIL rate (from EVENTS.md) → cmd: arch report; exit: 0
- [x] `arch report` writes a generated metrics block to `docs/METRICS.md` → cmd: test -f docs/METRICS.md; exit: 0
- [x] THINK Phase 3 step 4 (Sprint Metrics) references `arch report` instead of manual computation → prose: verified by reading THINK.md
- [x] `arch review` passes → cmd: arch report && arch review; exit: 0
- [x] Tests pass → cmd: npm test --prefix cli; exit: 0

### Definition of Done
- [x] All ACs checked.
- [x] `arch review` passes.
- [x] `npm test` passes in `cli/`.

## Hansei
The decision to use git history as a fallback for `createdAt` was necessary but required extending a protected domain repository. This complexity was justified to ensure "truth in metrics," but it highlights how the lack of a standardized task creation timestamp in the metadata forces us into deeper infrastructure dependencies.
