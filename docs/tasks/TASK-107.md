## TASK-107: arch review detects stale references to deleted files
**Meta:** P2 | S | READY | Focus:no | 7-operations | local | cli/src/main/ts/domain/services/drift-checker.ts

### Acceptance Criteria
- [ ] `DriftChecker` scans all `docs/tasks/*.md` files for file paths in the `Context` field.
- [ ] Any path that does not exist in the repository (and is not a glob) is reported as a `DeadContext` warning.
- [ ] Stale TASK-ID references in `Depends:` that no longer exist in `docs/tasks/` or `docs/archive/` are reported.
- [ ] The check is integrated into `arch review` output.
- [ ] `arch review` passes.

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
