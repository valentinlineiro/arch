# IDEA: Loop mode load balancing
**Created:** 2026-05-06
**Source:** human report
**Status:** DRAFT
**Meta:** P2 | S | cli | local

## Problem
Currently, `arch loop` follows a fixed cycle: GOVERN → SELECT → EXEC → REVIEW → ARCHIVE. It primarily focuses on executing READY tasks. If there are many IDEAs in the Refinement Queue, they might sit there indefinitely while the loop only processes the backlog, leading to a bottleneck in the pipeline.

## Proposed solution
Introduce a load-balancing mechanism in `LoopEngine`. If certain thresholds are met (e.g., >20 pending IDEAs), the loop should prioritize a "Refinement" phase (invoking a REFINE agent) over executing the next task.

The loop could dynamically adjust its "mode" based on system metrics:
- High Refinement Queue → Trigger REFINE
- Low Backlog → Trigger CONDUCT (Replenishment)
- High READY tasks → Trigger EXEC (current behavior)

## Dependencies
none

## Estimated size
S

**Sessions:** 1

## Gaps
- Define the specific threshold value (currently proposed as >20 IDEAs).
- Specify how the REFINE agent is invoked: is it a subcommand (`arch loop --refine`) or an internal call in `LoopEngine`?
- Safety: ensure the refinement phase doesn't consume the entire context window if there are many IDEAs.

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
