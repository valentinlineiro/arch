## TASK-129: Reduce Meta fields to comply with simplification mandate
**Meta:** P3 | XS | 5 | READY | Focus:no | 7-operations | local | docs/tasks/, docs/agents/
**Depends:** none

### Acceptance Criteria
- [ ] Audit Meta fields across all active tasks and templates.
- [ ] Remove the `Value` field from the Meta line in all files (or another redundant field to reach count of 7).
- [ ] Update `cli/src/main/ts/domain/services/task-validator.ts` regex to expect 7 fields.
- [ ] Update `docs/guidelines/core.md` or relevant protocol docs to reflect the new Meta format.
- [ ] `arch review` passes.

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
