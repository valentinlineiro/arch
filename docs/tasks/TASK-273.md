## TASK-273: Implement parallel task execution with file-overlap detection and locking
**Meta:** P2 | M | READY | Focus:no | 7-operations | claude | cli/src/main/ts/

### Context

Running tasks in parallel with different CLI agents creates merge conflicts when they modify the same files. There is currently no system to detect or prevent these collisions. This task adds file-overlap detection before parallel execution, a file locking mechanism, and a queuing strategy for colliding tasks.

### Acceptance Criteria

- [ ] Before starting parallel task execution, the system detects file overlap between concurrent tasks and either queues or rejects conflicting pairs.
- [ ] A file locking mechanism prevents two agents from writing to the same file simultaneously during task execution.
- [ ] `arch review` passes.  →  cmd: arch review; exit: 0

### Definition of Done

- [ ] Parallel task file-overlap detection and locking implemented end-to-end.
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
