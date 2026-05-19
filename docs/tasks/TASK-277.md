## TASK-277: Implement automatic entity linking between tasks, commits, ADRs, and guidelines
**Meta:** P3 | M | READY | Focus:no | 2-code-generation | claude | cli/src/main/ts/domain/

### Context

Relationships between ARCH entities (tasks, commits, ADRs, guidelines) exist implicitly in commit messages and references but are never materialized. An agent wanting to know which commits implemented a task or which tasks cite an ADR must grep manually with no guarantee of completeness. This task implements automatic linking at write and index time using TASK-219's ContextIndex infrastructure.

### Acceptance Criteria

- [ ] Tasks are linked to commits via TASK-ID refs in commit messages, stored in the context index.
- [ ] ADRs are linked to tasks via task `Depends` fields and ADR references in task context.
- [ ] Links are surfaced in `arch ask` queries and task context feedback.
- [ ] `arch review` passes.  →  cmd: arch review; exit: 0

### Definition of Done

- [ ] Automatic entity linking implemented and queryable via arch ask.
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
