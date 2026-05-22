# IDEA: sprint-state-machine — formalize ACTIVE/CLOSED/NEXT_PENDING states
**Created:** 2026-05-22
**Source:** TASK-957 BLOCKED — no formal sprint state model
**Status:** DRAFT
**Meta:** P1 | S | 2-code-generation | cli/src/main/ts/domain/models/sprint.ts, arch.config.json | Sessions: 1

## Problem

`TASK-957` (Automatic sprint lifecycle) is blocked because the system lacks a formal model of a sprint. Currently, "sprint" is just a string in `arch.config.json`. There is no state machine to manage transitions between sprints, no authoritative oracle for sprint metadata, and no way to ensure idempotency when closing a sprint and opening the next one.

## Proposed Solution

1. **Sprint Domain Model**: Create `Sprint` and `SprintStatus` (ACTIVE, CLOSED, NEXT_PENDING) models in the domain layer.
2. **Authoritative Oracle**: Define `arch.config.json` as the intent oracle and `.arch/focus-ledger.jsonl` as the event oracle.
3. **Transition Logic**: Implement a `SprintService` that handles:
    - `closeCurrent(velocityData)` -> marks current sprint CLOSED, appends SPRINT_CLOSE to ledger.
    - `openNext(nextName)` -> creates NEXT_PENDING sprint, transitions to ACTIVE on first task archive.
4. **Idempotency**: Ensure that re-running `arch govern` during a sprint transition does not create duplicate sprints or retros.

## Constraint Axes
- Dependency ordering: None.
- Temporal validity: Valid; needed to unblock P1 task.
- Abstraction layer: Correct — domain concern.
- Observability validity: Deterministic — events in ledger.
- Priority displacement: P1 — unblocks P1 task.

## Decision
<!-- PROMOTE → TASK-XXX | REJECT: reason | DEFERRED: reason + condition -->
