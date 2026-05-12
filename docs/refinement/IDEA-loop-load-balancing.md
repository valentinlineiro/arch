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

**Sessions:** 2

## Gaps
- Define the specific threshold value (currently proposed as >20 IDEAs).
- Specify how the REFINE agent is invoked: is it a subcommand (`arch loop --refine`) or an internal call in `LoopEngine`?
- Safety: ensure the refinement phase doesn't consume the entire context window if there are many IDEAs.

## Constraint axis evaluation (2026-05-12)
| Axis | Status | Note |
|------|--------|------|
| Dependency ordering | **Violated** | Requires a REFINE agent as a runtime component — currently agents are instruction documents, not runtime (IDENTITY.md §3) |
| Temporal validity | **Violated** | >20-IDEA threshold is hypothetical; the bottleneck has not been observed empirically |
| Abstraction layer | Satisfied | LoopEngine is correct layer |
| Observability validity | **Violated** | No metric for "refinement queue pressure" exists that LoopEngine can read |
| Priority displacement | **Active** | TASK-190 (L3 loop mode) is still READY; load balancing is downstream of stable loop mode |

Not structurally admissible. Revisit after TASK-190 is done and empirical evidence of queue pressure accumulates.

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
