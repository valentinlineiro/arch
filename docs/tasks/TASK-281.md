## TASK-281: Implement operational load tracking - WIP, cognitive cost, rework rate metrics
**Meta:** P2 | M | READY | Focus:no | 2-code-generation | claude | docs/METRICS.md, cli/src/main/ts/

### Context

ARCH models tasks as units of work but ignores human cognitive load. WIP accumulation, context-switching cost, fatigue cycles, and rework are invisible to the system. This task extends METRICS.md and task metadata to track WIP count, cognitive cost per task, rework rate, and recovery cycles, with `arch review` warnings when WIP exceeds configured thresholds.

### Acceptance Criteria

- [ ] `docs/METRICS.md` documents operational load signals: WIP count, cognitive cost, rework rate, and recovery cycles.
- [ ] `arch review` warns when simultaneously IN_PROGRESS task count exceeds a configurable WIP threshold.
- [ ] `arch review` passes.  →  cmd: arch review; exit: 0

### Definition of Done

- [ ] Operational load metrics defined and WIP threshold check implemented in arch review.
- [ ] `arch review` passes.

## Hansei
**Severity:** H0
**Category:** [SpecDrift]

**Decision:**
Task created at promotion time; no implementation decisions made yet.

**Constraint:**
Hansei fields populated at creation to satisfy pre-commit linter requirement for M+ tasks.

**Cost:**
No implementation cost incurred at this stage.

**Forward Action:**
Real Hansei to be written at REVIEW time per ADR-019.
