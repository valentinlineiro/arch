# IDEA: IDEA adjudication throughput mismatch
**Created:** 2026-05-25
**Source:** Human structural review
**Status:** ARCHIVED
**Meta:** P0 | M | local | docs/refinement/

## Problem
The system generates IDEAs faster than a single human can adjudicate them. 33+ OPEN escalations, many duplicated across record formats, with no dedup or auto-expiry for orphaned proposals. The append-only escalations model guarantees noise accumulation with no compaction path. This is a systemic throughput mismatch between REFLECT's generation rate and the human's decision capacity — not a backlog problem, but a structural rate imbalance.

## Proposed solution
Introduce auto-expiry for OPEN escalation records past a configurable TTL (e.g., 30 days) with no human interaction. Add batch adjudication surface: group OPEN IDEAs by theme, present structured comparison, allow single-decision resolution of related proposals. Add a generation rate governor: if OPEN escalations exceed threshold N, REFLECT enters reduced-emission mode until the queue drains.

## Dependencies
- TASK-1017 (escalations dedup — clears current backlog before new policy applies)
- IDEA-promotion-decision-support (decision quality at the gate is prerequisite to higher throughput)

## Estimated size
M

## Gaps

**Sessions:** 2

## Decision
EXTEND. Required decomposition before this can be promoted: the auto-expiry TTL mechanism is independently actionable and should be extracted as a standalone S IDEA; the batch adjudication surface is speculative and should be deferred indefinitely; the rate governor is novel and can remain in this IDEA's scope. Trigger: a standalone IDEA for auto-expiry TTL enforcement is filed and this IDEA is narrowed to rate governor only. Do not promote the combined scope — the rate governor is useful; the batch surface is premature.

**Decision:** PARTIALLY SUPERSEDED — arch triage (TASK-1073) addresses the human throughput bottleneck for remote IDEAs. Escalation compactor handles escalation noise. Remaining concern (IDEA generation rate exceeding human capacity) is addressed by this adjudication pass. No further structural change needed now.
