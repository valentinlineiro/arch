# IDEA: human-review-rejection-workflow
**Created:** 2026-04-28T14:34:00Z
**Source:** TASK-124 solution was rejected - no easy way to reject
**Status:** PROMOTED → TASK-125
**Meta:** P1 | XS | 7-operations | workflow

## Problem
When a human reviews a task in REVIEW status, there's no streamlined way to reject the solution. The only option is to manually edit the task, which is friction-heavy and discourages rejection feedback.

## Proposed solution
Add a simple command `arch task reject <task-id> --reason "<feedback>"` that:
1. Moves task back to READY (or BACKLOG if major rework needed)
2. Records rejection reason in task comments
3. Triggers a Kaizen note in the next THINK run (highlighting the pattern)

## Dependencies
None

## Estimated size
XS

## Gaps
<!-- THINK fills this section when invoked — do not edit manually -->

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->