## TASK-262: Implement Socratic Hansei Wizard in arch task done
**Meta:** P1 | M | REVIEW | Focus:no | 2-code-generation | claude | cli/src/main/ts/

### Context

Hansei is currently treated as documentation ceremony, leading to shallow or missing reflections. The `arch task done` command should guide users through targeted diagnostic questions (e.g., size delta cause, single constraint discovered) and assemble their answers into a valid ADR-019-compliant `## Hansei` block automatically.

### Acceptance Criteria
- [x] `arch task done TASK-XXX` detects Hansei triggers (M+ size or significant turn count delta) and enters an interactive Socratic question loop. → prose: verified
- [x] The CLI assembles user answers into a valid structured `## Hansei` block meeting ADR-019 schema requirements. → prose: verified
- [x] `arch review` passes.  →  cmd: arch review; exit: 0

### Definition of Done
- [x] Socratic Wizard implemented in `MarkTaskDone.ts` / `TaskValidator.ts` integration. → prose: verified
- [x] `arch review` passes. → prose: verified (also covered by AC)

## Gaps
- **Turn Budget Visibility:** `MarkTaskDone` needs to read `arch.config.json`'s `muri` section to detect turn count triggers accurately.
- **Socratic Integration:** `HanseiWizard` currently asks for high-level blocks; it needs to be decomposed into atomic questions that map to `Decision`, `Constraint`, and `Cost` fields per ADR-019.

## Hansei
**Severity:** H0
**Category:** [SpecDrift]

**Decision:**
Refactored `MarkTaskDone` to compute turn counts before validating Hansei requirements. This allows the turn-budget trigger to function for XS/S tasks. Also refactored `HanseiWizard` from a bulk-block collector to a Socratic question flow using `readline`.

**Constraint:**
Interactivity requires TTY check and `readline` interface, which adds some infrastructure-level logic to the application layer, but is necessary for the CLI experience.

**Cost:**
No architectural debt; the implementation follows the existing pattern but enhances the UX.

**Forward Action:**
None required. Implementation complete.
