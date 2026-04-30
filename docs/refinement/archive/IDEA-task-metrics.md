# IDEA: Track task cost and steps for KAIZEN friction detection
**Created:** 2026-04-29T08:45:00Z
**Source:** human
**Status:** DRAFT
**Meta:** P2 | XS | claude | cli

## Problem
When the model executes a task (THINK or DO mode), there's no visibility into resource consumption or effort. KAIZEN cannot detect friction patterns (e.g., tasks that consistently take high cost or many steps) without this data.

## Proposed solution
1. Extend task metadata to capture:
   - **Cost:** Total LLM API cost in USD (accumulated from all turns in the task)
   - **Steps:** Number of model turns/cycles to complete the task
2. After task completion, append `Cost: $X.XX` and `Steps: N` to the task's Meta line
3. KAIZEN can then analyze historical data to detect friction (e.g., tasks with cost > $X or steps > N) and propose improvements

## Dependencies
- TASK-092 (arch status sprint view) — not required but useful context
- None blocking

## Estimated size
XS

## Gaps
- Cost Tracking: Verify if the current CLI or `scripts/arch.sh` has access to token usage/cost data from the model provider.
- State Persistence: Decide where to store the running cost/steps count before the task is finalized (e.g., a temporary hidden file or session variable).
- Multi-Agent Support: Ensure cost is aggregated if multiple sub-agents are invoked.

## Decision
PROMOTE → TASK-133