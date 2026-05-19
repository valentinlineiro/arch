# TENSION-006: Dual inbox truth surfaces
**Detected:** 2026-05-19
**Detected by:** human
**Status:** open
**Impact class:** epistemic → structural

---

## Legitimacy gate

- [x] **Concrete actor**: An agent or human runs `arch govern inbox`, sees no pattern alerts, and acts as if the system is clean — while `docs/INBOX.md` contains a PATTERN-ALERT about [SpecDrift] detected 8 times marked as systemic. Both surfaces are in normal use.
- [x] **Named invariant**: CLAUDE.md §Invariants: "INBOX.md is human-only. Agents write to it; humans read it." This designates INBOX.md as the authoritative human-facing surface — but `arch govern inbox` gives a materially different picture, making the invariant unenforceable in practice.
- [x] **Probable**: The append-only write model guarantees drift. Every `arch govern` tick that appends without overwriting static sections widens the gap. The current session confirmed this: 87 stale AWAITING_PROMOTION entries visible in the file, zero in the live view. A systemic PATTERN-ALERT present only in the file.
- [x] **Asymmetric damage**: Systemic signals (pattern alerts, persistent escalations) written to INBOX.md become invisible to the live view. A human consulting `arch govern inbox` for triage sees a clean state. A human consulting `docs/INBOX.md` sees a stale state with phantom entries. Neither surface is trustworthy as the sole source. The consequence is governance blind spots, not merely stale UI.

---

## Boundary
`docs/INBOX.md` (static, append-only, agent-written) vs `arch govern inbox` (live, computed from filesystem + escalations.jsonl).

## Current ambiguity
Both surfaces are described as "the inbox." INBOX.md is written by agents during govern ticks and is designated as the human-readable view. `arch govern inbox` is the live computed view. Neither is declared subordinate to the other. There is no reconciliation mechanism.

## Likely misuse
"The live view shows no pattern alerts and zero escalations, so the system is clean."  
A contributor following the live-view model misses systemic signals that were written only to the static file by a past THINK session.

Inverse: "INBOX.md shows TASK-919, TASK-940 as AWAITING_REVIEW, so those still need auditing."  
A contributor following the static file model acts on tasks that were archived sessions ago.

## Violation risk
Breaches the intent of the INBOX.md invariant: if the file can contain false positives (stale tasks, stale escalations) and false negatives (missing pattern alerts visible to the live view), it cannot function as the reliable human-facing triage surface it is defined to be.

Consequence class: epistemic. The system stores contradictory beliefs about its own governance state in two places. Triage decisions made from either surface are unreliable.

## Preventive invariant
One surface must be authoritative. Either:
- `arch govern` refreshes (overwrites) the static sections of INBOX.md on each tick, making the file a rendered projection of the live view rather than an append-only log; or
- INBOX.md is explicitly scoped to append-only audit trail only, and `arch govern inbox` becomes the sole triage surface, with pattern alerts and escalations surfaced there too.

The pattern alert content currently visible only in INBOX.md (`[PATTERN-ALERT] [SpecDrift] detected 8 times`) must be surfaced by the live view — it is governance-critical and cannot live only in a static file.

## Required correction
1. Decide which surface is authoritative (IDEA or ADR).
2. If INBOX.md: `arch govern` must regenerate its structured sections on each tick — not append.
3. If `arch govern inbox`: pattern alerts and escalation history must be surfaced there; INBOX.md becomes audit log only.
4. The [SpecDrift] × 8 pattern alert must be reconciled against TENSION-005 (which records 3 occurrences) — counts diverge, one or both are wrong.

## Resolution
<!-- Fill when status moves to frozen or watching -->
