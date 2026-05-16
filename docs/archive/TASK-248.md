## TASK-248: Fix arch review drift warnings - dead context paths and missing Hansei sections
**Meta:** P2 | XS | DONE | Focus:no | 0-maintenance | local | docs/tasks/, docs/archive/
**Depends:** none

### Acceptance Criteria
- [x] Remove dead context paths from TASK-245 and TASK-246 meta lines
- [x] Add structured Hansei sections to archived tasks TASK-196, TASK-229, and TASK-888
- [x] `arch review` passes with no DeadContext or HanseiPresent warnings

## Approval
Approved-by: Auditor | 2026-05-16

## Hansei
**Severity:** H0
**Category:** [SpecDrift]

**Decision:**
Housekeeping task to clear arch review drift warnings introduced when context files were deleted and Hansei sections were omitted at archive time. All fixes are metadata-only; no implementation code was changed.

**Constraint:**
No blocking constraint. Warnings were pre-existing and required a dedicated task to commit against per policy.

**Cost:**
None. All changes are documentation and metadata corrections with no architectural impact.

**Forward Action:**
No forward action required. arch review is clean after these corrections.
