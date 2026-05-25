# IDEA: escalation-lifecycle-gap — escalation store diverges silently from actual task state
**Created:** 2026-05-25
**Source:** Human observation — 71+ phantom OPEN escalations discovered during escalation backlog review
**Status:** DRAFT
**Meta:** P1 | M | claude-code | .arch/escalations.jsonl, docs/agents/THINK.md, docs/agents/DO.md

## Problem

The `.arch/escalations.jsonl` store accumulated ~71 effectively open `AWAITING_PROMOTION` entries that were all phantoms — every underlying IDEA had been decided and its referenced task archived. The store had diverged completely from actual system state without any agent or governance process noticing.

Two compounding causes:

**1. No close-loop write at promotion time.**
When an IDEA is promoted (human writes `PROMOTE → TASK-XXX` in the Decision field), neither DO.md nor THINK.md requires the promoting agent to append a `RESOLVED` record to `escalations.jsonl`. The escalation is opened by THINK (Phase 1, idempotency check), but nothing closes it. The lifecycle has an open end.

**2. No cross-check between escalation state and task/archive state.**
`arch review` and `arch govern` do not verify that open `AWAITING_PROMOTION` escalations correspond to IDEAs that still lack a Decision. A quick cross-check — "does this IDEA file have a Decision field with a referenced task that is now archived?" — would catch phantom entries automatically.

The deduplication fix (TASK-999) addressed append-time idempotency but left the close-loop gap intact. New escalations will not duplicate; existing decided-but-not-resolved ones will continue to accumulate silently.

### Why this matters

The escalation store is documented as "source of truth for ANDON_HALT and AWAITING_PROMOTION events." A store that shows 71 open items when the true open count is 0 is not a source of truth — it is noise. Agents and governance tools relying on it will misread system state. Human review sessions will waste time (as in this session) clearing phantom entries manually.

## Proposed solution

**Two-part fix:**

**Part A — Protocol: close-loop write at promotion**
Update THINK.md Phase 1 (AWAITING_PROMOTION append step) and DO.md (IDEA promotion instructions) to require: when an IDEA's Decision field is written with `PROMOTE → TASK-XXX` or `REJECT`, append a `RESOLVED` entry to `escalations.jsonl` with the subject, reason, and `resolved_by: <actor>`. This closes the lifecycle at the point of decision.

**Part B — Structural: `arch review` cross-check**
Add a drift check to `DriftChecker`: for each `OPEN` `AWAITING_PROMOTION` escalation, verify the referenced IDEA file exists AND its Decision field is empty. If the Decision field is populated (promoted or rejected), flag the escalation as stale — `arch review` emits a WARN and optionally auto-resolves if the task is archived.

Part B is the safety net for cases where Part A is missed (e.g., human writes Decision directly without going through a THINK session).

## Dependencies
- TASK-999 (escalation deduplication) — done, prerequisite met

## Estimated size
M — touches THINK.md, DO.md, DriftChecker, and potentially a migration pass for any future phantom accumulation

## Gaps

## Decision
PROMOTE → TASK-1012: two-part fix — (A) update THINK.md/DO.md to require RESOLVED write at promotion time; (B) add DriftChecker cross-check for stale open escalations.
