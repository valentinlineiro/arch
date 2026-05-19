## TASK-262: Implement Socratic Hansei Wizard in arch task done
**Meta:** P1 | M | IN_PROGRESS | Focus:yes | 2-code-generation | claude | cli/src/main/ts/

### Context

Hansei is currently treated as documentation ceremony, leading to shallow or missing reflections. The `arch task done` command should guide users through targeted diagnostic questions (e.g., size delta cause, single constraint discovered) and assemble their answers into a valid ADR-019-compliant `## Hansei` block automatically.

### Acceptance Criteria

- [ ] `arch task done TASK-XXX` detects Hansei triggers (M+ size or significant turn count delta) and enters an interactive Socratic question loop.
- [ ] The CLI assembles user answers into a valid structured `## Hansei` block meeting ADR-019 schema requirements.
- [ ] `arch review` passes.  →  cmd: arch review; exit: 0

### Definition of Done
- [ ] Socratic Wizard implemented in `MarkTaskDone.ts` / `TaskValidator.ts` integration.
- [ ] `arch review` passes.

## Gaps
- **Turn Budget Visibility:** `MarkTaskDone` needs to read `arch.config.json`'s `muri` section to detect turn count triggers accurately.
- **Socratic Integration:** `HanseiWizard` currently asks for high-level blocks; it needs to be decomposed into atomic questions that map to `Decision`, `Constraint`, and `Cost` fields per ADR-019.

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
