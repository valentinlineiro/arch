# IDEA: inbox-hygiene — INBOX.md automatic stale entry cleanup
**Created:** 2026-05-24
**Source:** Human UX — INBOX is 67 lines of noise, humans stop reading it
**Status:** PROMOTED
**Meta:** P2 | S | human | docs/INBOX.md, cli/src/main/ts/application/use-cases/hansei-synthesizer.ts

## Problem

`docs/INBOX.md` accumulates without expiry. Current problems:
1. Escalation entries for tasks that are DONE (arch-resume showing as pending after TASK-1001 closed)
2. AWAITING_REVIEW entries for tasks already archived
3. PATTERN-ALERT for [SpecDrift] has been there 10+ days — systemic issues don't resolve by reading the same alert
4. SEMANTIC-DRIFT entries from weeks ago for files already fixed

Humans stop reading INBOX when the signal-to-noise ratio drops below ~50%. Currently it's ~20%. A governance inbox that isn't read is not a governance inbox.

## Proposed Solution

`arch govern` runs an INBOX hygiene pass after each tick:

1. **Stale escalation entries**: any `AWAITING_REVIEW` or `[AWAITING_PROMOTION]` whose task/IDEA appears in `docs/archive/` → remove from INBOX
2. **PATTERN-ALERT deduplication**: if the same `[PATTERN-ALERT] [Category]` appears more than once → keep only the most recent
3. **Age-based expiry** (configurable, default 14 days): non-deterministic entries (`[ADVISORY]`, `[SEMANTIC-DRIFT]`, `[THINK]`) older than N days → remove
4. **Deterministic entries never expire**: `ANDON_HALT`, `CORPUS_ALERT` stay until explicitly resolved

`arch govern --clean-inbox` forces a full hygiene pass without waiting for the tick.

## Constraint Axes
- Dependency ordering: None
- Temporal validity: Valid now — INBOX is already noisy
- Abstraction layer: Correct — post-tick maintenance step in govern
- Observability validity: Deterministic — age + task archive status are verifiable
- Priority displacement: P2 — governance signal quality, not a blocker

## Gaps
- None blocking.

## Decision
PROMOTE → TASK-1009
