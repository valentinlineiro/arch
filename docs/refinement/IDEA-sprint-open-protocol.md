# IDEA: Add sprint open protocol to DO.md
**Created:** 2026-04-30
**Source:** Protocol audit — DO.md has sprint close but no sprint open
**Status:** DRAFT
**Meta:** P2 | S | local | docs/agents/DO.md, docs/TASK-FORMAT.md, arch.config.json

## Problem
DO.md defines a full Sprint Close sequence (verify DONE → generate METRICS.md → clear currentSprint) but has no Sprint Open protocol. Sprint naming and scoping happen ad-hoc: agents write `sprint/<slug>` in task files without any defined ceremony, criteria, or commit. This makes sprint boundaries inconsistent and hard to trace in git history.

## Proposed solution
Add a "Sprint Open" operation to DO.md Intent: Operations. The sequence:
1. Human declares the sprint theme/slug.
2. Agent sets `"currentSprint": "sprint/<slug>"` in `arch.config.json`.
3. Agent assigns `**Sprint:** sprint/<slug>` to all tasks the human designates as in-scope.
4. Commit: `chore: open sprint/<slug> [THINK]`.

This mirrors the close sequence and makes sprint boundaries explicit and traceable.

## Dependencies
None.

## Estimated size
S

## Gaps

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
