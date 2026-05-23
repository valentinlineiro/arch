## TASK-262: Implement Socratic Hansei Wizard in arch task done
**Meta:** P1 | M | DONE | Focus:no | 2-code-generation | claude | cli/src/main/ts/
**Closed-at:** 2026-05-19T11:25:00.000Z

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

## Approval
Approved-by: human | 2026-05-23
Notes: Retroactive approval — M task closed without Approval section.
