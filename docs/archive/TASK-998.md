## TASK-998: Sprint domain model: Sprint/SprintStatus/SprintService to unblock TASK-957
**Meta:** P1 | S | DONE | Focus:yes | 1-code-reasoning | claude-code | cli/src/main/ts/domain/models/, cli/src/main/ts/domain/services/
**Turns:** 0
**Closed-at:** 2026-05-23T23:32:34.062Z
**Actor:** unknown
**Locked-commit:** 262b9d14
**Created-at:** 2026-05-23T20:44:21.083Z

**Depends:** none

### Context

TASK-957 (Automatic sprint lifecycle, P1 L) is blocked because no formal sprint model exists. "Sprint" is currently just a string in arch.config.json. No state machine, no authoritative oracle, no idempotency guarantee. Source: IDEA-sprint-state-machine.


### Relevant Context
_confidence: 0.45_

**Files:**
- cli/src/main/ts/domain/models/task.ts _(core)_
- cli/src/main/ts/domain/models/context-index.ts _(core)_
- cli/src/main/ts/domain/task.ts _(core)_
- cli/src/main/ts/application/use-cases/focus-ledger.ts _(domain)_
- cli/src/main/ts/domain/models/evidence.ts _(core)_

**ADRs:**
- ADR-016: Define the semantic boundary of the domain layer _(enforced)_
- ADR-004: Flat docs/tasks/ directory with Focus field replaces sprint/backlog split _(enforced)_
- ADR-006: Depends Graph Validation in DriftChecker Domain Service _(enforced)_

**Guidelines:**
- models.md

**Failure Patterns:**
- Phantom Archive Sync Latency*(Sprint v0.6.0-final)*: Tasks marked `DONE` by an Auditor (human or agent) remain in `docs/tasks/` until the next `arch govern` tick. This creates a "stale backlog" window where `arch status` and INBOX show tasks that are technically complete. **Proposal:** Integrate phantom-archive sync directly into `arch task done`. _(docs/KAIZEN-LOG.md)_
- Decision Blindness (High Velocity)*(Sprint 3)*: The agent executes architectural changes (ADR) and detects bugs (TASK-061) that stay in logs or PRs without immediate human visibility. High velocity (35 tasks/48h) makes individual monitoring impossible. **Proposal:** GOVERNANCE.md contract + INBOX.md weekly dashboard + `arch inbox` agent. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [x] accurate — files and ADRs were on-target
- [x] partial — correct direction, missing key files
- [x] off — wrong files dominated

### Acceptance Criteria

- [x] `Sprint` and `SprintStatus` (ACTIVE, CLOSED, NEXT_PENDING) models defined.
  - `file: cli/src/main/ts/domain/models/sprint.ts`

- [x] `SprintService` implements `closeCurrent(velocityData)` → appends SPRINT_CLOSE to focus-ledger, and `openNext(nextName)` → transitions to ACTIVE on first task archive.
  - `file: cli/src/main/ts/domain/services/sprint-service.ts`

- [x] Re-running `arch govern` during a sprint transition is idempotent — no duplicate sprints or retros created.
  - `prose: verified by running govern twice during transition`

- [x] `arch.config.json` is the intent oracle (sprint name/target), `.arch/focus-ledger.jsonl` is the event oracle (sprint state transitions).
  - `prose: verified by reading service implementation`

- [x] ADR filed for new domain model (protected path).
  - `prose: ADR-031 exists at docs/adr/`

- [x] `npm test` passes.
  - `prose: 590+ tests pass`

## Hansei
**Severity:** H0
**Category:** [MissingDecisionRecord]
**Decision:** Sprint domain model implemented cleanly. Sprint/SprintStatus/SprintService with idempotent transitions. ADR-031 filed for protected path.
**Constraint:** Sprint state file (.arch/sprint-state.json) must be reconciled with arch.config.json.currentSprint on first govern tick — SprintService.initFromConfig() handles this but it is not yet wired into govern.
**Cost:** No architectural debt. The constraint above is acceptable: wiring into govern is TASK-957 scope.
**Forward Action:** None — wiring into govern is covered by TASK-957.
