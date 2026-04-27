# IDEA: Kaizen cycle when no tasks available
**Created:** 2026-04-27
**Source:** Human request via THINK mode
**Status:** DECIDED

## Proposal
When the system detects that there are no more `READY` tasks available (or the backlog is near depletion), it should automatically trigger a comprehensive Kaizen cycle. This cycle aims to analyze the current state of the repository, review the `KAIZEN-LOG.md`, and identify new technical or procedural improvements to generate high-value tasks.

## Gaps
- **Trigger:** Handled via THINK Phase 1 (Threshold check: < 3 tasks).
- **Analysis Depth:** Last 10 archived tasks + Last 3 Kaizen-log entries.
- **Value Metric:** Focus on Drift, Automation, and Pruning.
- **Relationship with THINK mode:** Formal Phase 4: Autonomous Replenishment.

## Decision
Implement Phase 4 in `docs/agents/THINK.md`. The agent must proactively propose at least one new IDEA when the task queue is low.
PROMOTE → TASK-054
