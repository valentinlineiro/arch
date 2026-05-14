## TASK-244: Hansei Validator Enforcement (ADR-019)
**Meta:** P1 | M | DONE | Focus:no | 7-operations | local | cli/src/main/ts/domain/services/task-validator.ts, docs/TASK-FORMAT.md, GEMINI.md
**Closed-at:** 2026-05-14T12:20:00Z
**Depends:** none

### Acceptance Criteria
- [x] `task-validator.ts` enforces the mandatory structured Hansei schema defined in ADR-019 (Severity, Category, Decision, Constraint, Cost, Forward Action).
- [x] Enum validation for Severity: `[H0, H1, H2, H3a, H3b]`.
- [x] Enum validation for Category: strictly limited to the controlled vocabulary in ADR-019.
- [x] Detect semantic vagueness in fields (Decision, Constraint, Cost) using length thresholds (min 10 chars) and forbidden vague phrases (e.g., "temporary workaround").
- [x] Logic validation: H2 classification strictly requires an `IDEA-XXX` link in Forward Action or evidence of repetition in Decision.
- [x] Logic validation: H3b classification requires a specific Expiry Resource (`TASK-XXX` or `IDEA-XXX`) and an Owner/Architect in the Decision field.
- [x] Task move to `REVIEW` or `DONE` is blocked if the Hansei section is missing, malformed, contains unauthorized categories, or is semantically vague.
- [x] Update `docs/TASK-FORMAT.md` and `GEMINI.md` to reflect the mandatory structured Hansei requirements.

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
