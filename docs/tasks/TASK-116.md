## TASK-116: arch review priority-focus drift check
**Meta:** P2 | XS | 8 | READY | Focus:yes | 7-operations | local | cli/src/main/ts/domain/services/drift-checker.ts

### Acceptance Criteria
- [ ] `DriftChecker` identifies all `READY` tasks with higher priority (lower P-number) than any task currently in `Focus:yes`.
- [ ] Checks if these higher-priority tasks have unsatisfied `Depends:` fields.
- [ ] If a higher-priority task is NOT blocked and NOT focused, while a lower-priority task IS focused, `arch review` issues a WARNING.
- [ ] `arch review` passes.

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.

### Depends
- TASK-107
