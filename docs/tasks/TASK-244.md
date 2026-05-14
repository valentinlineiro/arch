## TASK-244: Hansei Validator Enforcement (ADR-019)
**Meta:** P1 | M | IN_PROGRESS | Focus:yes | 7-operations | local | cli/src/main/ts/domain/services/task-validator.ts, docs/TASK-FORMAT.md, GEMINI.md
**Depends:** none

### Acceptance Criteria
- [ ] `task-validator.ts` enforces the mandatory structured Hansei schema defined in ADR-019 (Severity, Category, Decision, Constraint, Cost, Forward Action).
- [ ] Enum validation for Severity: `[H0, H1, H2, H3a, H3b]`.
- [ ] Enum validation for Category: strictly limited to the controlled vocabulary in ADR-019 (Technical, Process, Constitutional groups).
- [ ] Logic validation: H2 classification requires evidence (linked in Forward Action or noted in Decision).
- [ ] Logic validation: H3b classification requires an Expiry Task (TASK-XXX) and an Owner in the Decision field.
- [ ] Task move to `REVIEW` or `DONE` is blocked if the Hansei section is missing, malformed, or contains unauthorized categories.
- [ ] Update `docs/TASK-FORMAT.md` and `GEMINI.md` to reflect the new mandatory structured Hansei requirements.

### Definition of Done
- [ ] `arch review` passes on a task with valid structured Hansei.
- [ ] `arch review` fails on a task with narrative Hansei or missing required fields.
- [ ] Unit tests for `task-validator.ts` cover all Hansei validation edge cases.
