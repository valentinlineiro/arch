# IDEA: Cap identical consecutive INFLUENCE_BREACH_PERSISTENT alerts in INBOX

**Created:** 2026-06-02
**Source:** Phase 1 replenishment — INBOX contains 29+ identical `INFLUENCE_BREACH_PERSISTENT` entries, engagement stuck at 41% vs 50%, system emits same message each cycle with no condensation or escalation
**Status:** REJECTED
**Candidate-class:** 7-operations
**Candidate-size:** S

## Problem

The REFLECT influence breach detection system emits `INFLUENCE_BREACH_PERSISTENT` alerts to INBOX.md every govern cycle when engagement falls below threshold. After 29 consecutive identical entries (same message, same 41% number), the INBOX is dominated by noise with no actionable signal. The 30th identical entry carries no more information than the 1st.

The system has no condensation mechanism: identical consecutive messages about the same breach are emitted verbatim each cycle rather than aggregated, capped, or escalated to a resolution task.

## Proposed outcome

INBOX accumulates no more than 5 identical consecutive `INFLUENCE_BREACH_PERSISTENT` entries. On the 6th consecutive identical match, rather than emitting another alert, the system appends an escalation record to `.arch/escalations.jsonl` with type `INFLUENCE_BREACH_STALLED` and stops emitting further identical alerts for that breach instance.

## Proposed solution

In the REFLECT influence monitor (or the INBOX write path):

1. Track last emitted alert type + value (e.g., `INFLUENCE_BREACH_PERSISTENT | 41%`)
2. On each new alert, check if it matches the last emitted type+value
3. If match: increment consecutive counter. If counter > 5: skip INBOX write, append escalation record instead
4. If no match: reset counter, emit normally
5. Breach data remains available via `arch reflect status` or `metrics.md` — only the INBOX emission is capped

## Validation hints

- Inject 7 identical breach alerts; INBOX shows max 5, 6th+ triggers escalation in `.arch/escalations.jsonl`
- Non-identical breach alerts (different metric, different value) each emit independently
- Existing INBOX entries from prior cycles remain unchanged (forward-only cap)
- `npm test` passes, `arch review` passes

## Dependencies

None — purely operational change in the INBOX write layer or REFLECT monitor output.

## Gaps

<!-- THINK fills this section when invoked — do not edit manually -->

## Sessions: 1

## Decision

REJECT — Subsumed by TASK-1082 (alert fatigue throttle in REFLECT). TASK-1082 implements the same cap-and-escalate mechanism. Promoting this IDEA would create a duplicate execution path.
