# IDEA: Archive distillation cycle (ORACLE) — proposals only, no direct writes
**Created:** 2026-04-30
**Source:** Human proposal (ORACLE protocol) — docs/archive/ accumulates wisdom that is never extracted into active guidelines
**Status:** DRAFT
**Meta:** P3 | L | claude | docs/archive/, docs/KAIZEN-LOG.md, docs/guidelines/

## Problem
`docs/archive/` grows continuously. Past tasks contain patterns, recurring mistakes, and solved problems that are never surfaced back into the active protocol. An agent starting a new session has no benefit from the 130+ completed tasks unless it reads the entire archive — which exceeds any practical context budget.

## Proposed solution
Add an ORACLE cycle to THINK Phase 3, triggered when `docs/archive/` crosses a multiple of 50 tasks. The agent:
1. Reads the most recent 50 archived tasks (not the full archive).
2. Identifies recurring patterns: common AC types, frequent blockers, sizing deltas, bug categories.
3. Outputs proposals **only** — creates IDEA drafts in `docs/refinement/` with extracted lessons (e.g. `IDEA-oracle-sizing-pattern-YYYY-MM-DD.md`).
4. Never writes directly to `core.md`, `KAIZEN-LOG.md`, or any guideline. Human reviews and promotes.

The hard constraint — proposals only, no direct guideline writes — prevents automated drift in the rules the system operates under.

## Dependencies
None, but benefits from CENSUS (context budget awareness) to bound the archive read.

## Estimated size
L

## Gaps
- Define the exact output format for distilled IDEA drafts to distinguish them from human-authored IDEAs.
- Decide whether ORACLE runs as part of the main THINK cycle or as a separate `arch oracle` command triggered manually.

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
