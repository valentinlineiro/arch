## TASK-154: Enforce path immutability via arch review check
**Meta:** P1 | M | READY | Focus:no | 7-operations | local | cli/src/, arch.config.json, docs/adr/
**Sprint:** sprint/v0.7-foundations

### Acceptance Criteria
- [ ] Add a `protectedPaths` array to `arch.config.json` including `docs/adr/`, `arch.config.json`, and `cli/src/domain/`.
- [ ] Implement a new `Immutability` check in `cli/src/main/ts/domain/services/reviewer.ts`.
- [ ] The check scans the most recent commit: if it touches a protected path, verify that the commit message references an `ADR-XXX` or the active task file contains an ADR reference in ACs/Depends.
- [ ] If the check fails, `arch review` should emit a WARN citing the path violation.
- [ ] `arch review` passes.

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
