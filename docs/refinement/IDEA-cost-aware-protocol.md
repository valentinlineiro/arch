# IDEA: Cost-aware protocol — track and constrain token/time/money cost per task
**Created:** 2026-04-30
**Source:** Strategic vision — every ARCH operation has a cost; the protocol currently ignores it entirely
**Status:** DRAFT
**Meta:** P2 | M | local | docs/METRICS.md, arch.config.json, docs/TASK-FORMAT.md

## Problem
Every `arch conduct`, `arch exec`, and `arch loop` invocation has a measurable cost in tokens, time, and money. ARCH currently tracks none of this. Without cost visibility, "self-improving codebase" can silently become "infinitely expensive codebase." There is no mechanism to flag when a task cost more than its estimated value, to route to cheaper models, or to set sprint-level cost budgets.

## Proposed solution
Add cost tracking at three levels:

**Task level:** Optional `Cost:` field in the task Meta line, filled at close. Tracks approximate token spend and wall-clock time. Sourced from the agent's session metadata or estimated from turns × model tier.

**Metrics level:** Add cost columns to `METRICS.md` sprint template: total spend, cost per task by class, cost per size tier, cost vs estimated-value ratio.

**Config level:** Add `sprintBudget` to `arch.config.json`. If cumulative sprint cost exceeds the budget, THINK Phase 1 emits a `[MURI]` warning and proposes deferring lower-priority tasks. The Andon Cord (TASK-143) adds a budget-exceeded halt condition.

Model routing already exists in `arch.config.json`; cost awareness would make routing decisions evidence-based (cheapest capable model, not just task class).

## Dependencies
TASK-143 (Andon Cord — budget-exceeded is Condition 2).
IDEA-mura-turns-per-size-metric (turns data feeds cost estimation).

## Estimated size
M

## Gaps
- Define "cost" precisely: actual API spend (requires log access), estimated from turns × model tier, or wall-clock time only?
- Decide whether `Cost:` in Meta is self-reported by agent or computed by the CLI from session metadata.

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
