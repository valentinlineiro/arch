# IDEA: arch task done guard - pre-archive AC check
**Created:** 2026-04-28
**Source:** THINK mode observation of TASK-112 violation
**Status:** PROMOTED -> TASK-115
**Meta:** P1 | XS | tool | scripts/arch.sh

## Problem
Tasks can be marked as DONE and moved to `docs/archive/` even if they have unchecked Acceptance Criteria. This leads to `arch review` failures later and requires manual cleanup or automatic bug creation.

## Proposed solution
Modify the `done` or `archive` command in `scripts/arch.sh` to:
1. Scan the task file for `[ ]` (unchecked boxes) before moving it.
2. If unchecked boxes exist, abort the archive operation and display a warning.
3. Allow an override flag (e.g., `--force`) for cases where an AC is intentionally skipped (though this should be rare).

## Dependencies
None

## Estimated size
XS

## Gaps
- Define the exact regex for AC detection: `^[\s]*- \[ \] `

## Decision
PROMOTED to TASK-115 by THINK agent (L2 Autonomy).
