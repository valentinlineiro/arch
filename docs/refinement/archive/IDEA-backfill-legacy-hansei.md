# IDEA: Handle legacy tasks missing Hansei sections
**Created:** 2026-05-12
**Source:** Phase-4 Kaizen
**Status:** DRAFT
**Sessions:** 2
**Meta:** P3 | XS | operations | docs/archive/

## Problem
`arch review` emits hundreds of warnings for legacy tasks (TASK-001 to TASK-183) that do not have a `## Hansei` section. This creates noise and obscures real violations in the active backlog.

## Proposed solution
Update the `HanseiPresent` check in `DriftChecker` to only enforce the section for tasks created after the protocol was mandated (TASK-195), or provide a script to backfill a minimal "Legacy task" Hansei section to all archived tasks.

## Rationale
Cleans up the `arch review` signal and adheres to P-003 (Quality gates must be machine-enforced) while acknowledging legacy state.

## Decision
PROMOTE → TASK-232 [influenced-by: none]
