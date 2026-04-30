## TASK-154: Enforce path immutability via arch review check
**Meta:** P1 | M | REVIEW | Focus:no | 7-operations | local | cli/src/, arch.config.json, docs/adr/
**Sprint:** sprint/v0.7-foundations

### Acceptance Criteria
- [x] Add a `protectedPaths` array to `arch.config.json` including `docs/adr/`, `arch.config.json`, and `cli/src/domain/`.
- [x] Implement a new `Immutability` check in `cli/src/main/ts/domain/services/reviewer.ts`.
- [x] The check scans the most recent commit: if it touches a protected path, verify that the commit message references an `ADR-XXX` or the active task file contains an ADR reference in ACs/Depends.
- [x] If the check fails, `arch review` should emit a WARN citing the path violation.
- [x] `arch review` passes.

### Definition of Done
- [x] All ACs checked.
- [x] `arch review` passes.
