# ADR-027: Epistemically Bounded Stream Projections — Non-Persistent Sequence Processing

**Date:** 2026-05-20
**Status:** ACCEPTED
**Deciders:** Valentín Liñeiro, Antigravity

---

## Context

Software engineering activities, version control histories, and build events are inherently sequential. Adjacency, ordering, and temporal sequence are not neutral metrics; they are the fundamental coordinates of causal identifiability in repository behavior.

In previous design iterations, we attempted to enforce absolute mathematical statelessness (permutation invariance) across the entire ARCH pipeline to prevent the reconstruction of developer identities and project intent. However, this forced an impossible and self-defeating axiom: that causality could be inferred from a decontextualized trace while destroying the sequence order that defines it. Conversely, letting state accumulate silently across executions degrades into covert behavioral profiling.

To resolve this conceptual contradiction, we reject both pure statelessness and unrestricted state. We establish the **Epistemically Bounded Stream System** model.

---

## Decision

We define Phase 3 (The Transient Actuation Projector) as a **pure function operating over sequential, windowed Phase 2 stream partitions, strictly bounded within the execution scope**.

### 1. Bounded Realism with Strict Non-Persistence
* The system is a deterministic, sequential stream processor. We preserve sequence order, batch-level temporal structures, and windowing boundaries because they are required to capture causality.
* **No Cross-Execution State**: Absolute non-persistence across runs is enforced. All state and memory generated during window compilation exist strictly within the boundaries of the active CLI execution scope and are completely purged from physical memory and disk upon completion.
* **Core Invariant**: No persistent cross-execution state may influence future inference:
  $$S_{N+1} = f(O_{N+1}) \quad \text{where } O_{N+1} \text{ is the current input, independent of } O_N$$

### 2. Execution-Bounded Metrics
* The concepts of "friction" and "constraint density" represent deterministic structural measurements calculated over the active sequence batch.
* All metrics, alerts, and distributions represent immediate, execution-scoped properties and are dissolved immediately upon actuation at the end of the runtime execution loop.

### 3. Separation of Concerns
* **Phase 1**: Lossless, ordered, deterministic syntactic normalization.
* **Phase 2**: Windowed local inference (locally stateful *within* the current execution scope only).
* **Phase 3**: Stateless projection of Phase 2 window outputs (mapping local window hypotheses to transient operational signals with zero persistence).

---

## Rationale

This model preserves causal identifiability while guaranteeing identity-non-reconstruction. By acknowledging that state exists locally within an execution run, we can process sequential events naturally. By strictly forbidding the persistence of state *across* runs, we prevent the statistical accumulation of behavioral profiles over long periods, neutralizing the latent actor reconstruction vector.

---

## Consequences

**Positive:**
* Mathematically consistent: preserves sequential causal structure while maintaining absolute epistemic safety across runs.
* Prevents silent cognitive degradation by maintaining a physical boundary around execution state.
* Cleans up the codebase by removing simulated stateless wrappers around fundamentally sequential data.

**Negative / trade-offs:**
* Temporal alerts requiring multi-session tracking (e.g. tracking whether an alert was triggered yesterday) must be delegated entirely to the external runtime environment (e.g. comparing the logs of a cron orchestrator) rather than being resolved inside the core execution model.

---
