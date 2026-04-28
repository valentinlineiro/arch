## TASK-083: arch review warns when REVIEW task has all ACs checked
**Meta:** P2 | XS | IN_PROGRESS | Focus:yes | 7-operations | cli | cli/src/main/ts/

### Acceptance Criteria
- [ ] `arch review` emits a WARNING for any task in REVIEW state where all AC checkboxes are `[x]`.
- [ ] Warning message suggests the archival command: `arch task done TASK-XXX`.
- [ ] Tasks in REVIEW with unchecked ACs are not warned.
- [ ] `arch review` passes on the updated codebase.

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
