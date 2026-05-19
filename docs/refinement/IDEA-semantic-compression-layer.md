# IDEA: semantic-compression-layer
**Meta:**Source: human | Status: DRAFT | Sessions: 1
**Created:** 2026-05-19

## Problem

Phase 1 reduces representational waste in governance inputs. It does not compress the cognitive cost of governance decisions. After Phase 1, the system produces cleaner, more verifiable governance objects — but each human decision still requires reconstructing context from scratch: what was decided before in similar situations, how novel this case is, whether a pattern is recurring or isolated.

This is the missing Layer 2 in ARCH's governance architecture (per `IDEA-governance-epistemic-doctrine`). Without it:

- **Throughput scales; understanding does not.** The system processes more tasks with less friction but cannot recognize when it is repeating, drifting, or encountering genuine novelty.
- **Phase 4 is incoherent.** Any authority delegation without a functioning semantic layer is optimization momentum dressed as deliberate policy. The system cannot know whether a decision is safe to delegate if it cannot tell whether that decision is genuinely routine.
- **Phase 1's hidden coupling activates without mitigation.** `verifiability-first-templates` shifts THINK into a compiler role. THINK's compilation choices shape what the governance system can represent. Without a semantic layer, those choices are invisible and unauditable.

## Proposed direction

The semantic compression layer is infrastructure for human governance decisions, not a replacement for them. It surfaces context; humans interpret it.

**Precedent indexing**
A queryable index of closed tasks: class, size, AC structure, Hansei severity distribution, closure path (L3 vs Auditor), and outcome. When a new task is created, the index returns the N most structurally similar historical tasks. The human sees: "5 similar tasks, all L3-closed, median 3 turns, no H2+ Hansei."

**Novelty scoring**
A distance function over the precedent index. For a given task, novelty = distance from nearest precedent cluster. High novelty → flag for human attention before execution, not after. Low novelty → proceed with existing L3 rules. This is the prerequisite for Phase 4: bounded auto-promotion is only meaningful if the system can distinguish routine from novel.

**Governance drift detection**
Time-series analysis over the Hansei archive: is the distribution of Severity levels shifting? Are H2+ findings concentrated in a specific class or time window? Are `prose:` ACs increasing as a fraction of total ACs? Drift is surfaced as a THINK signal, not a governance gate — it produces input to human deliberation, not an automated response.

**Institutional anomaly tracking**
Cross-task pattern recognition: tasks that repeatedly hit the same Andon condition, IDEAs from the same author that consistently get rejected, decision patterns that have no precedent in the archive. These are signals that the governance topology itself may need revision. Currently invisible; this layer makes them legible.

**Confidence calibration**
Track THINK's recommendation accuracy over time: when THINK flags novelty, was the human's decision consistent with what THINK would have predicted? When THINK suggests a size estimate, how often does actual size match? Calibration is not used to automate decisions — it is used to bound THINK's epistemic authority. A THINK that is poorly calibrated on novelty should have its novelty flags weighted accordingly.

## What this does NOT include

- Any automated decision based on semantic layer output. The semantic layer produces inputs; humans produce decisions.
- THINK autonomously assigning novelty labels that block task execution.
- Precedent similarity scores that substitute for human AC review.

## Relationship to other phases

This layer is the precondition for Phase 4, not just Phase 2:
- Phase 4 requires knowing which decisions are genuinely routine (low novelty, high precedent density, consistent outcome distribution).
- Without the semantic layer, "routine" is a feeling, not a measurement.
- With the semantic layer, "routine" becomes a falsifiable claim with a defined failure mode.

The verifiability-first templates IDEA creates the structural precondition for this layer: consistent AC structure makes precedent indexing meaningful. If governance inputs are ambiguous, similarity metrics are noise.

## Governance class

Class: II
Evaluates: Whether governance decisions are informed by structured historical context.
Does NOT evaluate: Whether historical precedent is correct or should be followed. Precedent is input; humans determine its weight.
Boundary risk: If precedent similarity scores are treated as decision confidence ("similar to past approvals → probably fine to approve"), the system has laundered authority through data. The mitigation is making calibration visible: the semantic layer must surface its own uncertainty, not just its findings. A precedent index that cannot express "I have never seen anything like this" is more dangerous than no precedent index at all.
