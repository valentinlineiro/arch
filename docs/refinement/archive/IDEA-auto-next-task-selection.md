# IDEA: Auto-select the next task when no blockers exist
**Created:** 2026-04-27
**Source:** Human request via DO mode
**Status:** PROMOTED -> TASK-069
**Meta:** P2 | S | local | docs/agents/DO.md, docs/agents/THINK.md, cli/

## Problem
Task execution still depends on a human or agent manually picking the next item, even when the queue contains an obvious unblocked candidate. That adds avoidable latency between tasks and slows down continuous execution.

## Proposed solution
Add a deterministic way for ARCH to auto-choose the next task when there are no blockers. The selector should prefer the highest-priority `READY` task, use `Focus:yes` ahead of `Focus:no`, respect dependencies, and only stop for human input when multiple candidates are equally valid or a blocking condition exists.

## Dependencies
none

## Estimated size
S

## Gaps
<!-- THINK fills this section when invoked — do not edit manually -->

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
