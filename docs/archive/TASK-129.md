## TASK-129: Reduce Meta fields to comply with simplification mandate
**Meta:** P3 | XS | DONE | Focus:yes | 7-operations | local | docs/tasks/, docs/agents/
**Closed-at:** 2026-04-30T08:15:02.446Z
**Depends:** none

### Acceptance Criteria
- [x] Audit Meta fields across all active tasks and templates.
- [x] Remove the `Value` field from the Meta line in all files (or another redundant field to reach count of 7).
- [x] Update `cli/src/main/ts/domain/services/task-validator.ts` regex to expect 7 fields.
- [x] Update `docs/guidelines/core.md` or relevant protocol docs to reflect the new Meta format.
- [x] `arch review` passes.

### Definition of Done
- [x] All ACs checked.
- [x] `arch review` passes.
