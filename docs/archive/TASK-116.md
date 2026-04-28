## TASK-116: arch review priority-focus drift check
**Meta:** P2 | XS | 8 | DONE | Focus:yes | 7-operations | local | cli/src/main/ts/domain/services/drift-checker.ts

### Acceptance Criteria
- [x] `DriftChecker` identifies all `READY` tasks with higher priority (lower P-number) than any task currently in `Focus:yes`.
- [x] Checks if these higher-priority tasks have unsatisfied `Depends:` fields.
- [x] If a higher-priority task is NOT blocked and NOT focused, while a lower-priority task IS focused, `arch review` issues a WARNING.
- [x] `arch review` passes.

### Definition of Done
- [x] All ACs checked.
- [x] `arch review` passes.

### Depends
- TASK-107

