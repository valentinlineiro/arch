# IDEA: Protocol Flow Guard
**Created:** 2026-04-28
**Source:** THINK agent
**Status:** PROMOTED -> TASK-121
**Meta:** P2 | XS | 7-operations | docs/agents/THINK.md

## Problem
Velocity drops to zero when all `Focus:yes` tasks are completed and archived, requiring human intervention to select the next task. This creates "Lull" periods in automated workflows.

## Proposed solution
Update `THINK.md` Phase 4 to include a "Flow Guard":
If no tasks are `Focus:yes` and `READY` tasks exist, the agent autonomously picks the task with the highest `Value/Size` ratio (or highest Value if sizes are equal) and promotes it to `Focus:yes`.

## Dependencies
none

## Estimated size
XS

## Gaps
<!-- THINK fills this section when invoked — do not edit manually -->

## Decision
<!-- Human writes here after THINK evaluation -->
