# ADR-022: Census Budget Recalibration for Capture Template

**Status:** Accepted
**Date:** 2026-05-18
**Context:** TASK-946 (1.0.0 release)

## Context

The `docs/tasks` Census budget of 1000 lines was established when tasks were created manually and averaged ~15 lines each. The `arch task capture` command (introduced in v0.5.x) generates tasks with structured sections — Relevant Context, Gaps, Decisions, Context Feedback, Hansei — that legitimately add ~10–20 lines per task. With 46 active tasks at the 1.0.0 milestone, the Census consistently warns at ~1250 lines against the 1000-line budget.

The warning is mechanically accurate but semantically wrong: it is not signaling that tasks need refactoring — it is signaling that the budget is stale relative to the template.

## Decision

Raise `contextBudget["docs/tasks"]` from 1000 to 1500.

The 1500-line ceiling preserves the intent of the Census check: signal when the active backlog is becoming unmanageable. At 1500 lines, the system begins warning when the backlog exceeds ~55 tasks (at current average size), which is a meaningful signal. At 1000 lines, it warned against a healthy 46-task backlog.

## Consequences

- Census warning is suppressed at current task volume.
- Budget still enforces discipline: an active backlog of 60+ tasks will re-trigger the warning.
- Future template growth that pushes averages above 30 lines/task should trigger another ADR rather than silent budget inflation.
