# IDEA: Ontological Tension Detection — a new artifact class and detection capability
**Created:** 2026-05-12
**Source:** TENSION-001 (govern/THINK boundary) — detected by human, not by system
**Status:** DRAFT
**Meta:** P1 | L | protocol | docs/tensions/, docs/agents/THINK.md, docs/IDENTITY.md

## Problem
Most serious architectural failures do not come from broken rules. They come from badly named categories that pass every check.

TENSION-001 is the exemplar: `arch govern` triggered THINK, creating a naming collision between enforcement and analysis. Nothing was broken. `arch review` passed. Chronicle had no edge for it. DriftChecker had no rule for it. A human caught it during reflection.

ARCH models tasks, decisions (ADRs), causal edges, and process failures (Kaizen). It does not model **category errors** — boundaries that are structurally at risk of future misuse even though nothing is wrong today. The system cannot ask: "is this boundary semantically stable under pressure?" It can only detect violations after they occur.

This is why the current real guardian is still human cognitive vigilance. That does not scale.

## The artifact class

A **TENSION record** (`docs/tensions/TENSION-NNN.md`). Not a bug. Not an ADR. Not Kaizen. Not a task.

It is: *"this feels structurally wrong, even if nothing is broken yet."*

Fields (see `docs/tensions/TEMPLATE.md`):
- **Boundary** — what two concepts are inadequately separated
- **Current ambiguity** — the specific design that creates the confusion
- **Likely misuse** — the specific future rationalization: "because X already does Y, it may also Z"
- **Violation risk** — which invariant would be breached if the argument succeeds
- **Preventive invariant** — the constraint that makes the misuse argument structurally invalid
- **Required correction** — naming change, command split, ADR, constitutional update

This is pre-incident forensics, not brainstorming. The "likely misuse" field is the critical one: it forces abandoning vagueness. Not "this feels off" but: *because X is named Y, future actor Z will rationalize action A, which violates invariant B*. That can be audited. That can be arbitrated. That can become policy.

## Legitimacy filter — required before any TENSION record is created

Not every ambiguity is a valid tension. Without a filter, the TENSION corpus fills with "possible future misuses" that are merely imaginable, and the signal collapses under its own weight. The following four conditions must all hold:

1. **Concrete actor**: a plausible future contributor who will reach this boundary in normal work. Not an adversary. Not a hypothetical edge case.
2. **Named invariant**: the misuse produces a violation of a specific, documented invariant — not aesthetic discomfort.
3. **Probable, not merely imaginable**: the current design contains a structural element (a name, a trigger, a shared command boundary) that makes the misuse argument feel reasonable to a reasonable person.
4. **Asymmetric damage**: the violation produces something worse than confusion — policy corruption, moat erosion, governance failure, loss of auditability.

If all four pass, write the record. If not, this is a concern, a heuristic, or a refactor candidate — not a TENSION.

## The bootstrapping trap — why this phase is dangerous

Human-only detection is correct now, but has a structural limit: it introduces a cognitive bottleneck, a bias toward the original designer's attention, and dependence on a single person's historical criterion. That does not scale.

But automating before a corpus exists is worse: an LLM with no pattern data generates false depth. "This feels architecturally suspect" applied indiscriminately is not detection — it is paranoia with elegant prose.

The trap: the system can start to "have opinions without friction." Once tension production becomes easy, everything looks like a future misuse, the ontology becomes paranoid, and utility falls under its own weight.

## The precision/recall tradeoff — and what it costs

The legitimacy gate solves noise. It does not solve discovery. Strong filters create a structural blind spot: the system only registers tensions it already knows how to formalize. Gradual naming drift, incremental semantic reuse, interpretation pressure accumulating under repeated use — none of these produce "asymmetric damage today." They produce it later. A system tuned only for precision will call that stable. It is not stable. It is losing sensitivity.

The missing concept: **latent misuse pressure.** Patterns where no immediate violation exists, but interpretation pressure accumulates under repeated use. The govern/THINK case was this: nothing broken, no test failed, but every session that used the command built up one more unit of "THINK is part of governance." That accumulation is not detectable by any rule. It is only detectable by noticing that an ontological claim is being made implicitly, repeatedly, without challenge.

A system that only detects incendios does not detect estructuras inflamables.

## Three-layer architecture — do not invert

**Layer 0 (now — required):** Weak signals. Human intuition fragments: "something feels structurally wrong but I can't formalize it yet." No legitimacy gate. No validation. No enforcement. Purely accumulative. Stored in `docs/tensions/weak-signals.md`. Purpose: capture what the system doesn't yet have vocabulary for. A clean weak-signals log means the system is losing early signals, not that the ontology is stable.

**Layer 1 (now — correct):** Validated TENSIONS. Human writes records. Strict legitimacy gate (four conditions). Low frequency. Canonical. Linked to invariants and Chronicle. TENSION-001 is the corpus seed.

**Layer 2 (after Layer 1 corpus, pattern classification complete):** LLM proposes tension *candidates* only. Never creates final TENSION records. Surfaces "this might be structurally ambiguous" — tagged as `candidate`, not `open`. A human validates the four legitimacy conditions before promotion. Layer 2 is ready when the Layer 1 corpus is large enough to classify failure types and establish expected false-positive rates. Without that baseline, any candidate list is uninterpretable.

**The transition signal from Layer 0 → Layer 1:** a weak signal recurs across 2+ sessions, or its area matches a validated TENSION. Recurrence under real use is the promotion criterion, not formalizability alone.

**The transition signal from Layer 1 → Layer 2:** the Layer 1 corpus contains enough records to say "this type of tension has appeared N times in context X." Before that, automation produces pattern-matching against a single data point.

## Why this is closer to Chronicle than to THINK

Chronicle captures what happened and why. Tension records capture what will happen and why, if the boundary is not frozen first. Both are epistemic infrastructure. Neither is UX.

A feature adds capability. A frozen invariant prevents decay. The second is usually more valuable. One well-captured tension record can prevent years of silent degradation.

## The key signal to track

Every time a human says: *"the system passed, but the ontology is wrong"* — that is a TENSION record waiting to be written. That corpus defines the real detection boundary.

## Dependencies
- IDENTITY.md §7 (Deterministic Core Invariant) — the constitutional framework TENSION records enforce
- docs/tensions/TEMPLATE.md — exists
- TENSION-001.md — the first record, written 2026-05-12

## Estimated size
L (the format is defined; the capability matures over time through corpus accumulation)

## Gaps

**Sessions:** 1

## Structural admissibility (5-axis)

| Axis | Status | Note |
|------|--------|------|
| Dependency ordering | Satisfied | TENSION-001 exists as corpus seed. |
| Temporal validity | Satisfied | Exemplar case (govern/THINK split) confirmed the need. |
| Abstraction layer | Satisfied | Correct layer for ontological stability. |
| Observability validity | Satisfied | Formally defined in Layer 1. |
| Priority displacement | Satisfied | P1. |

**Structural admissibility:** satisfied.

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
