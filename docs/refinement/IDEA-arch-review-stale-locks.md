# IDEA: arch review stale lock detection
**Created:** 2026-04-29
**Source:** THINK agent (Phase 4)
**Status:** DRAFT
**Meta:** P3 | S | 7-operations | scripts/arch.sh, cli/

## Problem
Currently, detecting "Stale Locks" (tasks `IN_PROGRESS` for >3 days without a commit) is a manual step in the `THINK.md` protocol (Phase 1). This is prone to human/agent error and delays detection of blocked tasks.

## Proposed solution
Implement a check in `arch review` (either in the script or CLI) that:
1. Scans `docs/tasks/` for files with `Status: IN_PROGRESS`.
2. For each, checks the date of the last git commit for that file.
3. If the date is > 3 days from the current date, report a violation: `[STALE LOCK] TASK-XXX has been IN_PROGRESS for N days.`

## Dependencies
- None

## Estimated size
S

## Gaps
<!-- THINK fills this section when invoked — do not edit manually -->

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
