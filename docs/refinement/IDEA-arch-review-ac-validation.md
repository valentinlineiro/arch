# IDEA: AC Validation in arch review
**Created:** 2026-04-30
**Source:** THINK Phase 4 (Protocol Hardening)
**Status:** DRAFT
**Meta:** P2 | S | 7-operations | docs/agents/THINK.md, scripts/arch.sh

## Problem
Currently, a task can be marked as `Status: DONE` even if some Acceptance Criteria (ACs) remain unchecked. While `arch review` checks for system misalignments, it doesn't currently verify that all ` - [ ] ` items are converted to ` - [x] ` or ` - [X] ` before a task is considered valid for archival.

## Proposed solution
Enhance `arch review` to:
1. Identify tasks in `docs/tasks/` with `Status: DONE`.
2. For those tasks, scan the content for any unchecked ACs (` - [ ] `).
3. If unchecked ACs are found, report a violation and block `arch review` from passing.

## Dependencies
None

## Estimated size
S

## Gaps
- **Convergence:** Coordinate with the existing shell-based guard in `scripts/arch.sh` (which blocks `task done`) to avoid redundant reporting.
- **Legacy Tasks:** Decide if the check should apply to `READY` tasks (as a warning) or only to `DONE/REVIEW` tasks (as a failure).

## Decision
<!-- Human writes here after THINK evaluation -->
