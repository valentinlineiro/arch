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

Extend `arch govern`'s existing focus-assignment step to consider IN_PROGRESS+Focus:no tasks as assignment candidates alongside READY tasks.

Current behavior: govern assigns Focus:yes only to the highest-priority READY task.
Proposed behavior: if no READY task is available (or after assigning one), govern also assigns Focus:yes to the highest-priority IN_PROGRESS task with Focus:no — using the same priority ordering already in place.

This is a one-line extension of the focus-assignment query, not a new mechanism. The FocusStatusAlignment drift check already flags the gap as `H1: debt of attention`; govern should close it deterministically rather than leaving it as a warning.

No reclamation, no revert, no commit-counting. Captured IN_PROGRESS tasks stay IN_PROGRESS — they just get focus assigned on the next tick.

## Validation hints

- Capture a task (creates IN_PROGRESS+Focus:no); run govern; verify Focus:yes assigned
- READY tasks still take priority over IN_PROGRESS tasks when both exist
- FocusStatusAlignment warning clears after govern tick
- `arch review` passes

## Dependencies

None — extends existing focus-assignment logic in `govern-system.ts`.

## Sessions: 0

## Decision

(awaiting human decision)
