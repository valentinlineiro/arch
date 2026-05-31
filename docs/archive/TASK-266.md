## TASK-266: Implement feature branch workflow - automatic branch-per-task execution
**Meta:** P3 | M | REJECTED | Focus:no | 2-code-generation | claude | docs/agents/DO.md, arch.config.json, cli/src/main/ts/

### Context

ARCH currently executes all tasks directly on `main`, preventing isolated execution, parallel task safety, and PR-based review workflows. This task automates a feature branch lifecycle where `arch task start` creates a `task/TASK-XXX` branch, implementation commits land there, and `arch task review` pushes the branch for merging.

### Acceptance Criteria

- [ ] `arch task start TASK-XXX` creates and checks out a `task/TASK-XXX` branch automatically.
- [ ] `arch task review TASK-XXX` pushes the branch and opens a PR or prepares for merge per the configured strategy (`squash | ff-only | merge`) in `arch.config.json`.
- [ ] `arch review` passes.  →  cmd: arch review; exit: 0

### Definition of Done

- [ ] Feature branch lifecycle (start → commit → review) implemented end-to-end.
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

## Approval
Approved-by: human | 2026-05-31
Notes: Retroactive approval.
