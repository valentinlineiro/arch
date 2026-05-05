# IDEA: Auto-populate METRICS.md from archived task data
**Created:** 2026-05-05
**Source:** Codex external review — "metrics look more like a schema plus sample dashboard than a deeply trusted measurement system"
**Status:** DRAFT
**Sessions:** 1
**Meta:** P2 | M | claude-code | cli/src/main/ts/, docs/METRICS.md

## Problem
METRICS.md has a well-defined schema (cycle time, cost per task, turns, REVIEW_FAIL rate) but is hand-populated. Hand-populated metrics are unreliable: they lag reality, are subject to selection bias, and require human discipline to maintain. The result is a dashboard that looks authoritative but isn't continuously verified.

## Proposed solution
Add an `arch report` command that reads all archived task files in `docs/archive/`, extracts structured fields, and writes a generated metrics block to `docs/METRICS.md`. `arch report` is a new top-level reporting command — not an extension of `arch review` (which stays read-only) and not a standalone `arch metrics`. THINK Phase 3 step 4 (Sprint Metrics) calls `arch report` instead of computing manually.

Key outputs to auto-generate:
- Cycle time P50/P90 per size tier (from `lockedAt` as proxy for startedAt → `closedAt`)
- Cost per task by size and class
- REVIEW_FAIL rate (from event log — see Dependencies)

Turns-per-task is **out of scope**: `steps` field is never populated in practice (verified).

## Dependencies
- **Event log for status transitions** — a new append-only log (e.g. `docs/EVENTS.md` or a structured field in task files) recording REVIEW → READY transitions. Required for REVIEW_FAIL rate. This is a prerequisite and should be scoped as a separate XS task.
- METRICS.md schema (TASK-159, archived) is the target format.

## Estimated size
M — event log prerequisite (XS) + archive parser + metric aggregator + `arch report` command + tests

## Gaps
All resolved:
- **REVIEW_FAIL tracking:** event log (portable, not git log parsing).
- **Turns-per-task:** dropped — `steps` field confirmed unpopulated.
- **Command:** `arch report` — new reporting command, consistent with fewer-commands principle.

## Decision
<!-- Human writes here after THINK evaluation -->
