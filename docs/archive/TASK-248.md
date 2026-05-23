## TASK-248: Fix arch review drift warnings - dead context paths and missing Hansei sections
**Meta:** P2 | XS | DONE | Focus:no | 0-maintenance | local | docs/tasks/, docs/archive/
**Depends:** none

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
