# IDEA: INBOX consistency gate — verify task file locations match computed status on govern tick

**Status:** DRAFT
**Created:** 2026-06-02
**Source:** THINK replenishment — TASK-1080 appears as "READY" in INBOX but its file is in docs/archive/, creating phantom count in status projection
**Candidate-class:** 7-operations
**Candidate-size:** S

## Problem

INBOX.md and the status projection are regenerated from computed task statuses, but there is no fs-consistency check. TASK-1080's file resides in `docs/archive/` (moved by a prior `arch govern` or Auditor action), yet INBOX reports it as `READY: 1 (TASK-1080)`. The regeneration reads meta lines from its internal index without verifying that the file is actually in `docs/tasks/`.

This means:
1. A task can be physically archived but still appear as READY/IN_PROGRESS in INBOX
2. The `READY` count inflates, masking the actual work available
3. The discrepancy persists until `arch govern` runs a full archive sweep, which may not happen until the next tick

The same gap exists in the IN_PROGRESS count: if a task file was moved manually or by a non-standard process, the counts drift silently.

## Proposed solution

Add a filesystem consistency check to the INBOX regeneration path (`govern-system.ts` or the status projection builder):

1. For each task in the computed READY/IN_PROGRESS/REVIEW list, verify the file exists at the expected path (`docs/tasks/TASK-XXX.md`)
2. For archived tasks appearing in active status lists, emit a warning and exclude from count
3. If a discrepancy is found, append a record to `.arch/escalations.jsonl` with type `INBOX_STATE_MISMATCH`

The check is advisory (non-blocking) — it flags drift without halting the tick.

## Validation hints

- Manually move TASK-XXX from `docs/tasks/` to `docs/archive/` without updating its meta line; next INBOX regen flags the discrepancy
- Archived task with READY/IN_PROGRESS meta line is excluded from active counts
- `npm test` passes
- `arch review` passes

## Dependencies

None — purely operational check in the govern/INBOX regeneration path.

## Sessions: 1

## Decision

PROMOTE → TASK-1083. Fold into TASK-1083 (single-source AGENTS.md + INBOX invariant fix) — the filesystem consistency check belongs in the same INBOX regeneration pass. Problem confirmed in this session: THINK Phase 1 read TASK-1080 from docs/tasks/ after govern had already archived it, producing a 404 and phantom READY count.
