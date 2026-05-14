## TASK-244: Hansei Validator Enforcement (ADR-019)
**Meta:** P1 | M | REVIEW | Focus:yes | 7-operations | local | cli/src/main/ts/domain/services/task-validator.ts, docs/TASK-FORMAT.md, GEMINI.md
**Depends:** none

### Acceptance Criteria
- [x] `task-validator.ts` enforces the mandatory structured Hansei schema defined in ADR-019 (Severity, Category, Decision, Constraint, Cost, Forward Action).
- [x] Enum validation for Severity: `[H0, H1, H2, H3a, H3b]`.
- [x] Enum validation for Category: strictly limited to the controlled vocabulary in ADR-019 (Technical, Process, Constitutional groups).
- [x] Logic validation: H2 classification requires evidence (linked in Forward Action or noted in Decision).
- [x] Logic validation: H3b classification requires an Expiry Task (TASK-XXX) and an Owner in the Decision field.
- [x] Task move to `REVIEW` or `DONE` is blocked if the Hansei section is missing, malformed, or contains unauthorized categories.
- [x] Update `docs/TASK-FORMAT.md` and `GEMINI.md` to reflect the new mandatory structured Hansei requirements.

### Definition of Done
- [x] `arch review` passes on a task with valid structured Hansei.
- [x] `arch review` fails on a task with narrative Hansei or missing required fields.
- [x] Unit tests for `task-validator.ts` cover all Hansei validation edge cases.

## Hansei
**Severity:** H1
**Category:** [TypeHack]

**Decision:**
Used `any` for the intermediate `hansei` object in `MarkdownTaskRepository` during parsing.

**Constraint:**
Time-boxing Task-1 implementation to allow moving to Review Reconciliation logic in Task-2.

**Cost:**
Minor type safety degradation in the infrastructure layer.

**Forward Action:**
none
