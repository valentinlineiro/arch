# IDEA: Dynamic Backlog Reprioritization
**Created:** 2026-04-28
**Source:** Human request — ensure we always work on highest-value tasks first
**Status:** PROMOTED -> TASK-108
**Meta:** P1 | S | 7-operations | docs/agents/THINK.md, scripts/arch.sh, docs/tasks/

## Problem
Currently, reprioritization is a manual file-by-file edit. While we have P0-P3 levels, there is no mechanism for a global "value-based" sort or a live way to shift the backlog when goals change. Agents follow priority but don't actively question if a READY task has decayed in value.

## Proposed solution
Implement a live reprioritization protocol within the `THINK` mode and `arch` CLI:

1. **New `Value` field:** Add a `Value: [1-10]` field to the Task Meta line. Agents propose this value during task creation or THINK refinement; humans must validate/edit it before promotion.
2. **`arch rank` command:** A new command that displays READY tasks sorted by Value Density (`Value / Size`), allowing a human to quickly "re-rank" by shifting values.
3. **Value-density sorting:** Update `arch next` and `arch govern` to prioritize tasks with the highest value-to-size ratio.
4. **Human Steering Gate:** THINK Phase 1 explicitly identifies tasks where the agent suggests a Value change based on new context.

## Estimated size
M (due to schema change across all tools)

## Gaps
- What defines "Value" for an agent vs. a human?

## Decision
PROMOTE -> TASK-108 (Addresses human request for value-based live reprioritization)
