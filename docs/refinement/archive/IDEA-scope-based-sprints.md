# IDEA: Scope-Based Sprints
**Created:** 2026-04-28
**Source:** User suggestion
**Status:** PROMOTED → TASK-091, TASK-092, TASK-093, TASK-094
**Meta:** P2 | L | process | docs/

## Problem
The current sprint model is ambiguous. It is not strictly time-boxed (e.g., weekly) nor is it strictly scope-based. This makes it difficult to define "done" for a sprint and to measure velocity or progress towards a larger goal.

## Proposed solution
Formally define a "sprint" as a collection of tasks that deliver a specific, named feature or epic, rather than a batch of work to be completed in a set time.
1.  **Sprint Definition:** A sprint would be initiated with a clear goal (e.g., "Sprint: Implement Guarded Done Transition").
2.  **Sprint Closure:** A sprint is "closed" only when all tasks associated with that epic are DONE.
3.  **Metrics:** Velocity would be measured by the time taken to complete a scoped sprint, not the number of tasks in a fixed time period.
4.  **Tooling:** `arch status` and `arch inbox` would need to be updated to report progress against the current named sprint.

## Dependencies
None

## Estimated size
L
