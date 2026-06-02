# IDEA: Govern-driven focus reclamation — revert focusless IN_PROGRESS tasks to READY

**Status:** DRAFT
**Created:** 2026-06-02
**Source:** THINK replenishment — READY count = 2 < 3 while 3 IN_PROGRESS tasks have Focus:no (TASK-1085, TASK-1086, TASK-1087)
**Candidate-class:** 7-operations
**Candidate-size:** XS

## Problem

The system allows `IN_PROGRESS` with `Focus:no` — 3 of 4 current IN_PROGRESS tasks are in this state. This means tasks were started but never focused, congesting the active task queue without producing progress. The READY floor is breached (2 < 3) partly because IN_PROGRESS tasks that should have been reclaimed back to READY remain in limbo.

There is no mechanism to detect or correct this. The Focus field is advisory only; no governance step checks whether an IN_PROGRESS task without Focus is making progress.

## Proposed solution

Add a lightweight check to the govern loop (or as a new step in `govern-transaction.ts`):

1. On each govern tick, scan all `IN_PROGRESS` tasks with `Focus:no`
2. For each, check if the last commit touching `docs/tasks/TASK-XXX.md` was more than N ticks ago (recommend: 2 govern ticks)
3. If yes: revert status to `READY`, set `Focus:no`, add a `### Reclaimed` annotation recording the revert
4. Emit `[RECLAIMED] TASK-XXX — reverted to READY after N ticks without activity` to INBOX

Threshold N and the tick counting mechanism should be configurable or hardcoded at 2 for the initial implementation.

## Validation hints

- Set TASK-1085, TASK-1086, TASK-1087 to Focus:no IN_PROGRESS (current state); run govern 2 ticks; verify they revert to READY
- After reclamation: READY count ≥ original + reclaimed count
- `arch review` passes

## Dependencies

None — purely operational, no ADR required. Govern loop already has focus pressure logic; this extends it with a reclamation path.

## Sessions: 0

## Decision

(awaiting human decision)
