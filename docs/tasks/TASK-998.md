## TASK-998: Sprint domain model: Sprint/SprintStatus/SprintService to unblock TASK-957
**Meta:** P1 | S | READY | Focus:no | 1-code-reasoning | claude-code | cli/src/main/ts/domain/models/, cli/src/main/ts/domain/services/

**Depends:** none

### Context

TASK-957 (Automatic sprint lifecycle, P1 L) is blocked because no formal sprint model exists. "Sprint" is currently just a string in arch.config.json. No state machine, no authoritative oracle, no idempotency guarantee. Source: IDEA-sprint-state-machine.

### Acceptance Criteria

- [ ] `Sprint` and `SprintStatus` (ACTIVE, CLOSED, NEXT_PENDING) models defined.
  - `file: cli/src/main/ts/domain/models/sprint.ts`

- [ ] `SprintService` implements `closeCurrent(velocityData)` → appends SPRINT_CLOSE to focus-ledger, and `openNext(nextName)` → transitions to ACTIVE on first task archive.
  - `file: cli/src/main/ts/domain/services/sprint-service.ts`

- [ ] Re-running `arch govern` during a sprint transition is idempotent — no duplicate sprints or retros created.
  - `prose: verified by running govern twice during transition`

- [ ] `arch.config.json` is the intent oracle (sprint name/target), `.arch/focus-ledger.jsonl` is the event oracle (sprint state transitions).
  - `prose: verified by reading service implementation`

- [ ] ADR filed for new domain model (protected path).
  - `prose: ADR-031 exists at docs/adr/`

- [ ] `npm test` passes.
  - `prose: 590+ tests pass`
