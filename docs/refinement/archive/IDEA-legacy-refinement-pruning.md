# IDEA: Legacy Refinement Pruning and Standardization
**Created:** 2026-04-29
**Source:** THINK agent (Phase 4)
**Status:** DRAFT
**Meta:** P3 | S | 6-writing | docs/refinement/

## Problem
The `docs/refinement/` directory contains several legacy `idea-*.md` files (lowercase, different structure) that are either partially promoted or stale. This creates context noise and violates the current `IDEA-*.md` canonical format.

## Proposed solution
1. Audit all `idea-*.md` files in `docs/refinement/`.
2. Convert those that are still relevant to the new `IDEA-*.md` format (uppercase, explicit Decision section).
3. Archive those that are redundant or already implemented to `docs/refinement/archive/`.
4. Update `THINK.md` or guidelines to explicitly forbid lowercase idea filenames.

## Dependencies
- None

## Estimated size
S

## Gaps
- Criteria for "stale" ideas: Suggesting any idea > 30 days old with no human activity.
- Definition of "canonical format": Ensure all promoted ideas follow the `IDEA-*.md` naming and header structure.
- Automation: Consider if `arch review` should flag non-canonical filenames in `docs/refinement/`.

## Decision
PROMOTE → TASK-135
