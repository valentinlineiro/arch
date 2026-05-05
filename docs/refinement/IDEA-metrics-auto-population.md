# IDEA: Auto-populate METRICS.md from archived task data
**Created:** 2026-05-05
**Source:** Codex external review — "metrics look more like a schema plus sample dashboard than a deeply trusted measurement system"
**Status:** DRAFT
**Meta:** P2 | M | claude-code | cli/src/main/ts/, docs/METRICS.md

## Problem
METRICS.md has a well-defined schema (cycle time, cost per task, turns, REVIEW_FAIL rate) but is hand-populated. Hand-populated metrics are unreliable: they lag reality, are subject to selection bias, and require human discipline to maintain. The result is a dashboard that looks authoritative but isn't continuously verified.

## Proposed solution
Add an `arch metrics` command (or extend `arch review`) that reads all archived task files in `docs/archive/`, extracts structured fields (closedAt, cost, steps/turns, size, class), and writes a generated metrics block to `docs/METRICS.md`. THINK Phase 3 step 4 (Sprint Metrics) would call this command instead of asking the agent to compute manually.

Key outputs to auto-generate:
- Cycle time P50/P90 per size tier (from closedAt − startedAt, if startedAt is recorded)
- Cost per task by size and class
- REVIEW_FAIL rate (tasks that transitioned REVIEW → READY)
- Turns per task from `steps` field

## Dependencies
- Requires `startedAt` to be recorded on task start (currently only `lockedAt` exists — likely sufficient)
- METRICS.md schema (TASK-159, archived) is the target format

## Estimated size
M — new CLI command, archive parser, metric aggregator, METRICS.md writer, tests

## Gaps
<!-- THINK fills this section when invoked -->

## Decision
<!-- Human writes here after THINK evaluation -->
