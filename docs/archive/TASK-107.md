## TASK-107: arch review detects stale references to deleted files
**Meta:** P2 | S | 5 | DONE | Focus:yes | 7-operations | local | cli/src/main/ts/domain/services/drift-checker.ts

### Acceptance Criteria
- [x] `DriftChecker` scans all `docs/tasks/*.md` files for file paths in the `Context` field.
- [x] Any path that does not exist in the repository (and is not a glob) is reported as a `DeadContext` warning.
- [x] Stale TASK-ID references in `Depends:` that no longer exist in `docs/tasks/` or `docs/archive/` are reported.
- [x] The check is integrated into `arch review` output.
- [x] `arch review` passes.

### Definition of Done
- [x] All ACs checked.
- [x] `arch review` passes.
