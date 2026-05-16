# IDEA: Grandfather legacy tasks in arch review
**Created:** 2026-05-06
**Source:** THINK session 2026-05-06
**Status:** PROMOTED
**Meta:** P2 | XS | cli | cli/src/main/ts/domain/services/drift-checker.ts

## Problem
The `HanseiPresent` check in `arch review` flags every legacy task (TASK-001 through TASK-188) that was archived before the Hansei protocol was mandatory. This results in >100 lines of WARN noise, obscuring potential violations in recent tasks.

## Proposed solution
Update `DriftChecker.ts` to only enforce `HanseiPresent` for tasks with ID > 188. Alternatively, use the `Closed-at` date if available, or a specific "Hansei-Mandatory-From" threshold.

## Dependencies
none

## Estimated size
XS

## Gaps
- Decide on the threshold: ID-based or date-based? ID-based is more robust for historical data in this repo.

## Decision
PROMOTE → TASK-899