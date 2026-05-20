# ARCH Governance Epistemic Doctrine
<!-- Established: 2026-05-20 | TASK-958 | Constitutional frame for ARCH automation -->
<!-- Re-entry index:
     "Is this friction constructive or bureaucratic?"              → §Friction Taxonomy
     "Which governance layer does this work touch?"                → §Governance Layer Model
     "Can Layer 2 detect genuine novelty?"                         → §Layer 2 Epistemic Ceiling
     "Is it safe to begin Phase N+1 work?"                         → §Governance Maturity Model (sequencing invariants)
     "Does this automation violate constitutional authority?"       → §Constitutional Invariants
     "Is disagreement being penalized structurally?"               → §Constitutional Invariants (invariant 5)
     "What failure mode is this pattern heading toward?"           → §Anti-Goals
     "Is the system eroding authority capacity, not just rights?"  → §Authority Erosion Dynamics
     "Is THINK shaping what governance can express?"               → §Governance Representation Boundary -->

## Core Principle

> ARCH exists to externalize procedural discipline without externalizing epistemic responsibility.

This is not a design preference. It is the load-bearing constraint. Any automation that violates it is unconstitutional regardless of whether it passes `arch review`.

---

## Problem

ARCH is accumulating pressure to reduce human interaction. That pressure is legitimate — clerical friction is real and correctable. But without an explicit constitutional frame, optimization work will reduce all friction indiscriminately: bureaucratic overhead and constructive friction alike.

The risk is not technical failure. It is **formal and practical authority diverging before anyone notices.**

Once humans psychologically adapt to machine-generated recommendations, reversibility becomes mostly theoretical. The system can retain every formal veto while operators behave as though approval is the default. That transition happens below the level of policy.

This document establishes the constitutional doctrine that must anchor all future automation work.

---

## Anti-Goals

These failure modes must be named explicitly. Systems decay toward unnamed failure modes.

| Failure mode | Description |
|---|---|
| **Ceremonial oversight** | Humans review machine outputs without genuine deliberation. Form of oversight survives; substance does not. |
| **Recommendation ratification** | Human "approval" of THINK-generated proposals becomes rubber-stamping. Distinction between deliberation and ratification collapses. |
| **Silent authority transfer** | Practical decision authority shifts to the machine without any formal policy change. Nobody decides this happens. |
| **Governance-by-inertia** | Decisions are made by timeout, default, or absence of objection rather than by choice. |
| **Confidence laundering** | Machine confidence scores or recommendation quality substitute for human judgment about novelty and legitimacy. |
| **Veto-default constitutionalism** | Humans retain formal veto power but internalize approval as the expected outcome. The veto becomes costly to exercise rather than the default. |

## Authority Erosion Dynamics

The anti-goals above describe *what* goes wrong. This section describes *how* — the mechanism by which authority transfer occurs below the level of policy.

Systems rarely remove human authority explicitly. They remove:

- **Confidence** — the operator's sense that their judgment differs meaningfully from the recommendation
- **Attentional bandwidth** — the cognitive capacity to reconstruct context independently
- **Reconstruction ability** — the accumulated habit of forming assessments without machine scaffolding
- **Disagreement normalcy** — the social and operational expectation that rejection is ordinary, not exceptional

**Constitutional rights can survive after constitutional capacities decay.** Authority erosion through cognitive dependency is a different failure mode from authority transfer through formal delegation — and harder to detect because the formal record looks intact.

The doctrine must account for both. Protecting rights without protecting capacities produces governance that is formally legitimate and practically hollow.

---

## Friction Taxonomy

Not all friction is the same. Future optimization work must distinguish:

**Bureaucratic friction** — overhead that consumes human attention without improving decision quality. Examples: manually filling Hansei field structure, writing boilerplate AC predicates, reconstructing context already present in the archive. This should be eliminated.

**Constructive friction** — overhead that specifically slows decisions where novelty or risk warrants deliberation. Examples: requiring a human Decision field before IDEA promotion, Auditor review for M+ tasks, explicit ADR for architectural changes. This must be preserved and sometimes strengthened.

**The test:** does this friction improve the quality of the decision, or only the cost of making it? If the latter, eliminate it. If the former, protect it.

---

## Governance Layer Model

ARCH's governance architecture is a three-layer stack. All three layers must exist for the system to function correctly.

**Layer 1 — Constitutional** (exists): Defines what must never be violated. Invariants, anti-goals, authority boundaries. This document.

**Layer 2 — Semantic** (missing): Defines what things mean relative to history. Precedent indexing, novelty scoring, similarity metrics over tasks, governance distance functions, risk calibration surfaces. Without this layer, the system can process efficiently but cannot recognize when it is repeating, drifting, or encountering genuine novelty. High determinism without semantic compression produces a brittle illusion of clarity — everything looks clean; nothing is actually simplified.

**Layer 3 — Operational** (being built): Defines how work is expressed and executed efficiently. AC templates, task capture tooling, Hansei serialization, L3 eligibility rules.

**The asymmetry warning:** Layer 3 without Layer 2 makes the system procedurally efficient and epistemically blind to drift. Throughput scales; understanding does not. This is the failure mode of many "efficient" governance systems. Phase 1 work builds Layer 3. Phase 2 work builds Layer 2. Phase 1 must not complete so far ahead of Phase 2 that the system normalizes operating without it.

**Layer 2 epistemic ceiling:** Layer 2 cannot reliably detect genuine novelty. What it detects is low statistical similarity to prior patterns. These are not equivalent:

- Similarity ≠ sameness
- Anomaly ≠ novelty
- Precedent distance ≠ legitimacy
- Low governance distance can still conceal constitutional discontinuity

Some of the most consequential authority transfers will score as minor optimizations. A small procedural change, an innocuous timeout, a marginal reduction in review overhead — each may look routine and still produce governance drift months later. Layer 2 infrastructure, if misread, upgrades heuristic pattern-matching into epistemic authority. This ceiling must be held explicit: Layer 2 produces inputs to human novelty adjudication; it does not substitute for it.

---

## Governance Maturity Model

The four phases below are **epistemic sequencing constraints**, not a roadmap. Each phase is a prerequisite for the next. Phase N+1 authority delegation is invalid without Phase N infrastructure in place.

**Phase 1 — Reduce representational waste in governance inputs**
Items: THINK-generated proposals, Hansei wizard, deterministic AC expansion, verifiability-first templates.
Goal: reduce representational waste — the cost of expressing and recording governance objects. Decision quality is unchanged; input entropy drops.
Note: "verifiability-first templates" shifts what counts as a governance object (structural ontology), not just how governance objects are handled. It is the seed of Phase 2, not only a Phase 1 item — see `IDEA-verifiability-first-templates` for the second-order effect on THINK's role.
Constitutional risk: Low for most items. Medium for verifiability-first templates, which shifts THINK from interpreter to compiler of governance constraints — an authority adjacency change that requires monitoring.

**Phase 2 — Compress governance cognition**
Items: precedent indexing, novelty scoring, confidence calibration, governance drift detection, institutional anomaly tracking.
Goal: reduce reconstruction cost. Humans can make Class II decisions faster because context is surfaced rather than reconstructed.
Constitutional risk: Medium. This infrastructure, if misread, can become a pipeline for authority transfer. It must produce inputs to human decisions, not substitutes for them.

**Phase 3 — Optimize temporal flow**
Items: async batching, deferred interrupt checkpoints, governance digests.
Goal: protect implementation flow state. Human decision count stays constant; interruption cadence drops.
Constitutional risk: Low-medium. Async patterns can erode accountability if escalations are deprioritized or forgotten.

**Phase 4 — Revisit constitutional automation**
Items: timeout semantics, bounded auto-promotion, delegated authority classes.
Goal: evaluate whether the system's epistemic maturity justifies limited authority delegation.
Constitutional risk: High. Only valid after Phase 2 infrastructure proves reliable. Must be evaluated with full precedent topology visible.

**The key sequencing invariant:** Phase 2 is what makes Phase 4 a genuine decision rather than momentum. Without precedent indexing, novelty scoring, and confidence calibration, any Phase 4 automation is authority transfer dressed as feature work.

---

## Constitutional Invariants

These hold regardless of which phase the system is in:

1. **Humans own novelty adjudication.** When a decision lacks precedent, a human decides. Machines may score novelty; they do not adjudicate it.
2. **Humans own topology mutation.** Changes to what governance checks exist, what they evaluate, and how failures are handled require human authorization.
3. **Humans own precedent creation.** The first instance of a decision pattern is always human-made. Machines may compress and index precedent; they do not establish it.
4. **Machines may prepare but not legitimize governance.** A THINK-generated proposal is preparation. The human decision that follows is legitimization. Collapsing these is the core failure mode.
5. **Human disagreement must remain operationally legitimate, low-friction, and non-exceptional.** Accepting a recommendation must not be structurally cheaper than rejecting it in cases requiring deliberation. When dissent becomes metabolically expensive — requiring justification, escalation, or social interruption that approval does not require — the machine governs statistically even while humans formally decide. The system must never make disagreement feel like blocking progress.

---

## Governance Representation Boundary

The constitutional invariants above govern authority allocation — who decides what. This section governs something upstream of that: what becomes *expressible* as a governance concept.

THINK is not merely a participant in governance execution. As it moves from interpreter to compiler of governance constraints, it participates in governance ontology formation — shaping what kinds of problems become legible, what structures become cognitively canonical, and what thoughts become easy or costly to articulate.

This is categorically different from tooling risk. A compiler of constraints redefines the thought surface: what looks like a reasonable problem formulation, what counts as a valid objection, what appears already-handled. Once machine-generated structure becomes cognitively canonical, humans may stop exploring representations the compiler does not produce — not because those representations are forbidden, but because they become difficult to hold.

**Invariant:** Machines may assist governance representation but must not become the exclusive substrate through which governance concepts are expressible or operationally legible.

This invariant is not satisfied by preserving formal alternatives. It requires that alternative representations remain cognitively accessible — that operators retain the capacity to think outside compiler-shaped structures, not merely the right to do so.

---

## Governance Class

**Class:** II
**Evaluates:** Constitutional intent and authority boundary stability over time.
**Does NOT evaluate:** Any specific implementation. This document has no executable ACs.
**Boundary risk:** This document is itself a Class II artifact. Its purpose is to hold the Class I/II boundary explicit and durable as Phase 1 work begins.
