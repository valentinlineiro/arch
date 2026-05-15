# THINK Phase Audit
<!-- Source: TASK-254 — classification of THINK.md phases for simplification planning -->
<!-- Status: Draft — requires human review before TASK-254 closes -->

## Purpose

This document classifies every phase and sub-step in `docs/agents/THINK.md` along a three-level axis:

- **structural** — if skipped, system integrity degrades or a hard-rule violation occurs. Must run in every THINK invocation.
- **deferrable** — valuable analysis that improves decisions but breaks nothing if omitted in a given session. Candidate for `arch improve --deep`.
- **overhead** — exists for consistency but has no enforcement teeth and is prone to generating noise rather than signal. Candidate for removal or tight scoping.

---

## Phase 1: Context & Replenishment

| Step | Classification | Rationale if skipped |
|------|---------------|----------------------|
| Health Evaluation (P0 lock detection) | **structural** | A P0 task with a stale lock > 3 days goes undetected. Produces a blocking bug task — actual enforcement action. |
| Replenishment check (READY < 3 → propose IDEA) | **structural** | core.md §5 declares this a hard rule. Without it, the queue can drain silently. |
| INBOX Regeneration (overwrite + commit) | **structural** | INBOX is the human-facing escalation surface. Stale INBOX means humans act on outdated state. |

**Phase 1 verdict: structural in full.** No step is deferrable without violating a hard rule or degrading the human-visible state.

---

## Phase 2: Idea Refinement

| Step | Classification | Rationale if skipped |
|------|---------------|----------------------|
| Process DECIDED IDEAs (L2 autonomy promotion) | **structural** | A human has already written a Decision. L2 autonomy rule requires execution once the decision is written. Skipping leaves a decided IDEA in a zombie state. |
| TTL archival (Sessions > 3 → archive as REJECTED) | **structural** | Without TTL enforcement the refinement queue grows unboundedly. The 28-idea backlog problem is partly caused by this not running consistently. |
| DRAFT evaluation (constraint axes, up to 3/session) | **deferrable** | Analysis only. Skipping one session delays feedback but nothing breaks. The 3-per-session cap already acknowledges this. |

**Phase 2 verdict: split.** The execution sub-steps (DECIDED promotion, TTL archival) are structural. The evaluation sub-step (DRAFT analysis) is deferrable and already rate-limited.

---

## Phase 2.5: Semantic Drift Analysis

| Step | Classification | Rationale if skipped |
|------|---------------|----------------------|
| Weak signal decay (deadline-bound emissions) | **deferrable** | Proposals only — output to stdout and reflect-proposals.jsonl. No enforcement consequence. AGENTS.md says "all due signals must surface in the same session," but that rule applies within Phase 2.5 — it's a completeness constraint on the phase, not a mandate to run the phase. |
| Conceptual contradictions (guideline conflicts) | **deferrable** | Pure observation. Skipping means contradictions persist longer, but the system doesn't break. |
| Structural duplication | **deferrable** | Pure observation. |
| ADR conceptual drift | **deferrable** | Valuable but advisory. Output is IDEA drafts, not enforcement changes. |
| Governance class boundary audit | **deferrable** | Requires human interpretation. Output is advisory. Protocol degeneration proxies are surface signals only (stated in THINK.md). |

**Phase 2.5 verdict: deferrable in full.** No step has enforcement consequences. The entire phase is a candidate for `arch improve --deep`. The weak signal decay step has a within-phase completeness rule, but the phase itself is not mandatory in every THINK invocation.

**Note on weak signal decay:** When Phase 2.5 runs, weak signal decay must run to completion without a per-session cap. That's a constraint on the phase's execution quality, not a mandate for its frequency.

---

## Phase 3: Continuous Kaizen

| Step | Classification | Rationale if skipped |
|------|---------------|----------------------|
| Kaizen Learning (arch review --json → proposals) | **deferrable** | Proposes hardening tasks but doesn't enforce them. Skipping means violations go unanalyzed longer. |
| Mura Detection (Turns analysis) | **deferrable** | Advisory pattern detection. No enforcement dependency. |
| Immediate Improvements | **overhead** | Freeform observation step with no concrete trigger or output format. In practice this is the step most prone to generating noise. If a pattern is real, Phase 2.5 or Mura Detection will surface it with more rigor. |
| Sprint Metrics (arch report) | **deferrable** | Updates METRICS.md, which has no enforcement dependency. Informational only. |
| Periodic Architecture Revision (bi-weekly) | **deferrable** | Explicitly time-gated. Already skips if < 14 days since last run. The time gate is doing the deferral work. |

**Phase 3 verdict: deferrable in full, with one overhead candidate.** "Immediate Improvements" (step 3) has no concrete input signal and no output format — it's the fuzziest step in the protocol and the one most likely to generate ceremonial output. Removing it or replacing it with a concrete trigger condition would tighten Phase 3.

---

## Recommended THINK default loop

If the goal is a lean default THINK that runs structurally necessary steps and defers analysis, the minimal viable loop is:

1. **Phase 1** (full) — health, replenishment, INBOX
2. **Phase 2** (structural sub-steps only) — DECIDED promotions + TTL archival; skip DRAFT evaluation unless session has capacity

Everything else moves to `arch improve --deep`:
- Phase 2 DRAFT evaluation
- Phase 2.5 (full)
- Phase 3 (full)

This reduces the default THINK cost significantly while preserving the guarantees that actually matter: queue health, human-decided promotions, and INBOX accuracy.

---

## Open questions for human review

1. **Weak signal decay frequency**: If Phase 2.5 moves to `arch improve --deep`, how often should it run? Weekly? On every `arch govern` call? The current "all due signals in one session" rule needs a frequency anchor.
2. **Phase 3 "Immediate Improvements" removal**: Is this step providing value in practice, or is it generating noise? The hansei-category-log will eventually answer this empirically — worth revisiting after 10+ tasks.
3. **arch report in the default loop**: `arch report` updates METRICS.md. If it moves to `--deep`, METRICS.md only updates when someone explicitly runs deep analysis. Acceptable, or does it need a lighter trigger?
