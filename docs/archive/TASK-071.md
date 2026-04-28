## TASK-071: Refactor CLI Entrypoint using Clean Architecture
**Meta:** P2 | S | 5 | DONE | Focus:no | 1-implementation | cli | src/main/ts/index.ts
**Depends:** none
**Locked-by:** claude | **Locked-at:** 2026-04-27T00:00:00Z

### Acceptance Criteria
- [x] Extract command handlers into `application/commands/` (status, validate, review, task, inbox, next)
- [x] Create `infrastructure/cli/output-formatter.ts` with colored console output
- [x] Move command parsing to a separate component
- [x] Keep `index.ts` as minimal DI bootstrap + command dispatch
- [x] Run tests and rebuild CLI

### Definition of Done
- [x] All existing commands work identically
- [x] Clean separation between CLI presentation and domain
- [x] Tests pass (12/13; 1 pre-existing failure in drift-checker unrelated to this task)