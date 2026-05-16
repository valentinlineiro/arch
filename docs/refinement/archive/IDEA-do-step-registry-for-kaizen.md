# IDEA: Register DO task steps for Kaizen optimization
**Created:** 2026-04-29
**Source:** Human suggestion during session
**Status:** DRAFT
**Meta:** P2 | S | claude | context

## Problem
When DO executes a task, the sequence of steps taken is not recorded anywhere. This means Kaizen has no structured data to analyze patterns, identify recurring friction points, or suggest flow improvements based on actual execution history.

## Proposed solution
During DO mode task execution, emit a structured step log (e.g. appended to the task file or a sidecar file) that captures ordered steps: what was done, in what phase, and any blockers or deviations. THINK/Kaizen can then read these logs to detect patterns and propose workflow improvements.

## Dependencies
None — can be implemented independently of other IDEAs.

## Estimated size
S

## Gaps
- **Storage:** Decide between appending to the TASK file (easy for humans) vs a hidden `.arch/` directory (easier for parsing).
- **Granularity:** Define what constitutes a "step" (every tool call? every 5 turns? manual human signal?).
- **Context Impact:** Ensure the log is not included in the default agent context to avoid consuming the budget.

## Decision
PROMOTE → TASK-XXX

## Decision
REJECT: Wrong time. Kaizen (Phase 3 in THINK) currently has no structured data consumption model. Building a step log before there is a defined consumer creates a maintenance burden with no feedback loop. The granularity question (every tool call? every 5 turns? manual signal?) is genuinely unresolved and cannot be resolved without first knowing what patterns Kaizen is trying to detect. Return when THINK Phase 3 has a concrete signal it needs that step logs would provide.
