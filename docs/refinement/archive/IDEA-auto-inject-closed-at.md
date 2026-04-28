# IDEA: Auto-inject Closed-at timestamp on arch task done
**Created:** 2026-04-28
**Source:** THINK Phase 4 — pattern in recent archive
**Status:** PROMOTED → TASK-081
**Meta:** P2 | XS | 1-implementation | cli

## Problem
The DO protocol requires `Closed-at: <ISO 8601>` when marking a task DONE, but this step is manual and frequently missed. TASK-075, TASK-076, and TASK-077 are all archived without a `Closed-at` field. Without it, cycle-time metrics (required by THINK Phase 3 sprint close) cannot be computed.

## Proposed solution
`MarkdownTaskRepository.save()` (or `MarkTaskDone`) injects `Closed-at` automatically when the status transitions to `DONE`, using the current UTC timestamp. No human action required.

## Dependencies
none

## Estimated size
XS

## Gaps
- Decide injection point: use-case layer (`MarkTaskDone`) vs. repository layer (`MarkdownTaskRepository.save()` when status is DONE). Repository layer is more robust (catches any path to DONE), but use-case layer is more explicit.
- Decide format: insert as a new line after `**Depends:**`, or append to the Meta line.

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
