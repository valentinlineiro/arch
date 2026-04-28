# IDEA: ARCH Review — Priority-Focus Drift Check
**Status:** DRAFT
**Class:** 7-operations
**Size:** XS
**Value:** 8

### Problem Statement
Currently, a P1 task can be ignored (`Focus:no`) while a P2 task is being worked on (`Focus:yes`), without any automated warning. This leads to priority starvation.

### Proposed Solution
Add a rule to `arch review` (or the `DriftChecker` service) that:
1. Identifies all `READY` tasks with higher priority (lower P-number) than any task currently in `Focus:yes`.
2. Checks if these higher-priority tasks have unsatisfied `Depends:` fields.
3. If a higher-priority task is NOT blocked and NOT focused, while a lower-priority task IS focused, issue a WARNING.

### Dependencies
- `TASK-107` (Drift checker improvements)

### Sizing Estimate
XS — It's a logic check in the existing drift checker.
