# IDEA: govern rebuilds context-index before focus assignment
**Created:** 2026-05-27
**Source:** smartcart-os observation — P1 task created and committed in same breath as govern tick; govern picked P2 task for focus because context-index hadn't been rebuilt yet and P1 task was invisible to the selector
**Status:** ARCHIVED
**Candidate-class:** 2-code-generation
**Candidate-size:** S

## Problem

`arch govern` assigns focus using the context-index on disk at tick time. If a high-priority task was just committed but the index hasn't been rebuilt since, that task is invisible to the focus selector. Govern picks the next visible task — potentially a lower-priority one. The error is silent: no warning is emitted, no stale-index detection happens.

Observed in smartcart-os: TASK-023 (P1) was committed, govern ran immediately, TASK-021 (P2) won focus because TASK-023 wasn't in the index yet.

## Proposed outcome

`arch govern` always produces correct focus assignments regardless of whether the caller rebuilt the index beforehand. A P1 READY task that exists in `docs/tasks/` at tick time wins focus over a P2 task, even if the index is stale or absent.

## Proposed solution

Two options:

**A — Trigger index rebuild as govern step 0 (preferred):** Before the focus selector runs, govern calls `BuildIndexUseCase.execute()` (or equivalent). This is already invoked in other contexts. Adds ~100ms per tick but makes the tick self-consistent.

**B — Bypass index for focus assignment:** The focus selector reads `docs/tasks/*.md` directly rather than relying on the index. Cheaper but diverges from how all other context lookups work.

Option A is cleaner. The index rebuild is idempotent and cheap compared to the LLM calls govern may trigger.

## Validation hints

- `cli/src/main/ts/application/use-cases/govern-system.ts` — verify rebuild call precedes focus assignment loop
- Test: create a new P1 READY task, delete/stale the context-index, run govern tick — P1 task must win focus
- `npm test` passes

## Dependencies

None

## Gaps

## Decision
PROMOTE → TASK-1060

**Decision:** IMPLEMENTED — rebuildContextIndex() extracted into govern-system.ts as named private method in TASK-1037. Context rebuild before focus is now explicit in execute(). No further action needed.
