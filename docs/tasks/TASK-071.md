## TASK-071: Refactor CLI Entrypoint using Clean Architecture
**Meta:** P2 | S | IN_PROGRESS | Focus:no | 1-implementation | cli | src/main/ts/index.ts
**Depends:** none
**Locked-by:** claude | **Locked-at:** 2026-04-27T00:00:00Z

### Acceptance Criteria
- [ ] Extract command handlers into `application/commands/` (status, validate, review, task, inbox, next)
- [ ] Create `infrastructure/cli/output-formatter.ts` with colored console output
- [ ] Move command parsing to a separate component
- [ ] Keep `index.ts` as minimal DI bootstrap + command dispatch
- [ ] Run tests and rebuild CLI

### Definition of Done
- [ ] All existing commands work identically
- [ ] Clean separation between CLI presentation and domain
- [ ] Tests pass