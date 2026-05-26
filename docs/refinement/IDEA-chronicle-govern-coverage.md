# IDEA: Emit chronicle signals for govern normal-path execution
**Created:** 2026-05-25
**Source:** Human structural review
**Status:** DRAFT
**Meta:** P0 | M | local | docs/refinement/

## Problem
By constitutional design, arch govern's normal execution path emits nothing to the causal graph. Most governance activity — the bulk of what the system does — is invisible to its own memory layer. The chronicle is therefore systematically biased toward failure events and anomalies. The system's understanding of its own behavior has blind spots precisely where degradation is most likely to be gradual and undetected. A system that only records exceptions cannot distinguish "everything is fine" from "nothing is being recorded."

## Proposed solution
Introduce lightweight structured emit for govern normal-path ticks: a single low-cost chronicle entry per govern run recording (focus assignments made, tasks archived, thresholds checked, violations found/none). This is not a full audit log — it is a heartbeat signal sufficient to detect when govern stops running, runs differently than expected, or changes behavior gradually over time. The emit should be cheap enough that volume is not a concern (one record per govern invocation).

**External analysis (DeepSeek, 2026-05-25):** Proposes a minimal three-field schema: `{tick_id, actions_taken: [focus_assign, archive_moves, ...], decision_count}`. This is a concrete, adoptable schema — use it as the starting point. Also proposes signing records for tamper-evidence; this introduces key management overhead not scoped here and should be deferred to a follow-on. Core additional insight: the heartbeat also detects when govern *stops running entirely*, not just when it runs badly — this is a distinct failure mode worth naming explicitly in the acceptance criteria.

## Dependencies
- ADR-026 (Epistemic Layer Separation) — the emit design must respect layer boundaries; verify signal type is appropriate for chronicle vs. event log

## Estimated size
M

## Gaps

**Sessions:** 2

## Decision
EXTEND. Correct diagnosis; minimal schema is adoptable (tick_id, actions_taken, decision_count). This is a retention feature — it detects degradation in users who already have the system. Trigger: IDEA-plg-onboarding-flow reaches DONE and the 90-day sprint's first objective (`arch init` flow) ships. Promoting before acquisition infrastructure lands inverts the sprint's explicit priority ordering.
