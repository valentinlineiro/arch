# IDEA: Mark resolved KAIZEN-LOG entries
**Created:** 2026-04-28
**Source:** THINK Phase 4 — stale entries in KAIZEN-LOG
**Status:** DRAFT
**Meta:** P3 | XS | 6-writing | docs/KAIZEN-LOG.md

## Problem
Two KAIZEN-LOG Tool entries describe problems that have since been resolved, but the log has no indication of this. New readers and agents treat them as open issues:
- "arch review does not validate ACs before archiving" → resolved by TASK-078.
- "arch --version does not exist as a subcommand" → resolved by TASK-072.

## Proposed solution
Append a `*(Resolved by TASK-XXX)*` note to each resolved entry. No deletion — the log is append-friendly and the historical record is valuable.

## Dependencies
none

## Estimated size
XS

## Gaps
None — scope is fully defined. Both entries and their resolving tasks are known.

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
