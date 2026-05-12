# IDEA: task-execution-plans
**Created:** 2026-05-06
**Source:** User request "idea: when creating a task, decompose it as a plan in order to let other less capable model to execute it"
**Status:** DRAFT
**Meta:** P2 | S | local | docs/TASK-FORMAT.md, docs/agents/DO.md
<!-- cli: local | claude | gemini | human -->

## Problem
Smaller or local LLMs often fail to execute tasks correctly even when the goal is clear, because they lack the "reasoning depth" to plan the sequence of tool calls (search -> read -> edit -> test) needed to fulfill the Acceptance Criteria.

## Proposed solution
1. Update `docs/TASK-FORMAT.md` to include an optional `### Execution Plan` section.
2. Update `docs/agents/DO.md` (Ops) and `docs/agents/THINK.md` (Refinement) to encourage generating a step-by-step plan when creating or promoting tasks, especially if `cli: local` is the target or if the task is `S` or larger.
3. The plan should be a bulleted list of high-level steps (e.g., "1. Search for X in Y", "2. Update Z to handle A", "3. Verify with B").

## Dependencies
None

## Estimated size
S

## Gaps
<!-- THINK fills this section when invoked — do not edit manually -->

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->

## Decision
REJECT: Wrong layer. The problem (smaller models failing at multi-step execution) is correctly addressed by model routing (arch.config.json assigns task classes to capable models) not by adding plan fields to task files. An `### Execution Plan` section requires the agent creating the task to predict the execution sequence — which requires the same capability the plan was supposed to compensate for. IDENTITY.md §5: adds abstraction without removing friction.
