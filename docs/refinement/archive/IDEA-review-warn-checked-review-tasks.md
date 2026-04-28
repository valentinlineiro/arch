# IDEA: arch review should warn when a REVIEW task has all ACs checked
**Created:** 2026-04-28
**Source:** THINK Phase 4 autonomous replenishment — pattern from TASK-080
**Status:** PROMOTED -> TASK-083
**Meta:** P2 | XS | 7-operations | cli/

## Problem
A task in REVIEW state with all AC boxes checked `[x]` is effectively done but will sit unnoticed until a human manually archives it. There is no automated signal prompting archival, causing unnecessary lifecycle stall.

## Proposed solution
Add a check in `arch review` that detects REVIEW-state tasks where every acceptance criterion checkbox is `[x]` and emits a WARNING: "All ACs checked — consider archiving with `arch task done TASK-XXX`."

## Gaps filled
- Scope: single check in the existing `arch review` validation pipeline.
- No new files required; extends the existing review command.
- Size: XS — one additional condition in the validator.
