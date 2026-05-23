# ADR-031: Sprint as a first-class domain model

**Date:** 2026-05-23
**Status:** Accepted
**Deciders:** Valen (human)
**Source:** TASK-998 — Sprint domain model to unblock TASK-957

## Context

Sprint was previously a raw string in `arch.config.json`. No state machine, no authoritative event log for transitions, no idempotency guarantee on close/open operations. TASK-957 (automatic sprint lifecycle) was blocked because there was no Sprint model to operate on.

## Decision

Introduce `Sprint` and `SprintStatus` as first-class domain models in `cli/src/main/ts/domain/models/sprint.ts`. Introduce `SprintService` in `cli/src/main/ts/domain/services/sprint-service.ts` as the single authority for sprint state transitions.

**Authority split:**
- `arch.config.json` is the **intent oracle** — declares the current sprint name and target
- `.arch/sprint-state.json` is the **state oracle** — persists the active Sprint struct
- `.arch/focus-ledger.jsonl` is the **event oracle** — append-only log of SPRINT_OPEN, SPRINT_CLOSE, SPRINT_NEXT_PENDING events

**Idempotency invariant:** Re-running any transition with the same sprint name is a no-op. `openNext("v1.2")` twice produces one SPRINT_OPEN event.

**State machine:**
```
NEXT_PENDING → ACTIVE (on openNext or first task archive)
ACTIVE       → CLOSED (on closeCurrent)
CLOSED       → (terminal for this sprint name)
```

## Consequences

- `SprintService` is the only permitted writer of `.arch/sprint-state.json`
- Direct writes to `arch.config.json.currentSprint` remain valid for human intent expression but do not trigger state transitions — `SprintService.initFromConfig()` reconciles on next govern tick
- `sprint.ts` and `sprint-service.ts` are protected paths — changes require a new ADR
