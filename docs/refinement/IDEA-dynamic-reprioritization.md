# IDEA: Dynamic Backlog Reprioritization
**Created:** 2026-04-28
**Source:** Human request — ensure we always work on highest-value tasks first
**Status:** DRAFT
**Meta:** P1 | S | 7-operations | docs/agents/THINK.md, scripts/arch.sh, docs/tasks/

## Problem
Currently, reprioritization is a manual file-by-file edit. While we have P0-P3 levels, there is no mechanism for a global "value-based" sort or a live way to shift the backlog when goals change. Agents follow priority but don't actively question if a READY task has decayed in value.

## Proposed solution
Implement a live reprioritization protocol within the `THINK` mode and `arch` CLI:

1. **`arch rank` command:** A new command that displays READY tasks sorted by Priority + Size, allowing a human to quickly "re-rank" by shifting a TASK-ID to a new priority level.
2. **Value-decay check (THINK Phase 1):** During system check, the agent evaluates if a READY task has been stale for too long or if its context has changed significantly, proposing a priority downgrade or upgrade.
3. **Value-density sorting:** Update `arch next` and `arch govern` to use a "Value Density" formula (e.g., `Priority / Size`) to ensure high-impact XS tasks are always prioritized over lower-impact large tasks within the same priority tier.
4. **Human Steering Gate:** Add a specific section in `THINK` output for "Reprioritization Proposals" where the agent suggests moving tasks (e.g., "TASK-090 should be P1 because it unblocks X").

## Estimated size
S

## Gaps
- What defines "Value" for an agent vs. a human?
- Should we add a `Value: [0-10]` field to the Meta line for more granular control?

## Decision
<!-- Human writes here after THINK evaluation -->
