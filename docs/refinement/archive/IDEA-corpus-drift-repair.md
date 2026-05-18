## IDEA: corpus-drift-repair

**Status:** PROMOTED
**Sessions:** 1
**Decision:** PROMOTE → TASK-933

### Problem

Three tasks in committed state violate ARCH operational conventions, producing persistent `arch review` warnings:

1. **TASK-249** (`docs/tasks/TASK-249.md:2`): `READY` status but `Focus:yes` — focus assigned to a non-executing task. Also missing `## Hansei` section (required for TASK-195+).
2. **TASK-919** (`docs/tasks/TASK-919.md:2`): `IN_PROGRESS` status but `Focus:no` — agent executing without focus sovereignty.
3. **TASK-258** (`docs/tasks/TASK-258.md:1`): no Acceptance Criteria found; missing `## Hansei` section.

These are not checker noise — they are real violations in the live task corpus that `arch review` surfaces on every run.

### Proposed Fix

For each task:
- **TASK-249:** Set `Focus:no` (it is READY, not executing). Add a minimal `## Hansei` stub if not archivable, or archive if it was completed without closure.
- **TASK-919:** Set `Focus:yes` (it is IN_PROGRESS). Verify the task is still actually in progress; if abandoned, move to BLOCKED or DONE.
- **TASK-258:** Add `### Acceptance Criteria` section and `## Hansei` section, or archive if done.

### Acceptance Criteria

- [ ] `FocusStatusAlignment` produces no warnings for TASK-249 and TASK-919.
- [ ] `TaskTemplateCompliance` produces no warnings for TASK-249, TASK-258.
- [ ] `arch review` warning count does not increase as a result of these fixes.

### Decision-required: no

## Decision
PROMOTE → TASK-933.
