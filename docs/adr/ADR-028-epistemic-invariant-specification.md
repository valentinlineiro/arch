# ADR-028: Unified Epistemic Invariant Specification — Bounded Stream Enforcement

**Date:** 2026-05-20
**Status:** ACCEPTED
**Deciders:** Valentín Liñeiro, Antigravity

---

## Context

In building the Cross-Repo Operational Ontology, the greatest risk is **silent semantic drift**: developers and models seeking to optimize temporal alerts by leaking memory across CLI invocations. To ensure the framework remains structurally secure, we require a **formal, mathematically precise invariant specification** that defines the absolute boundaries of the sequential stream execution pipeline.

---

## Decision

We establish the following formal invariant specifications for Phase 1, Phase 2, and Phase 3. Any violation of these specifications detected during compilation or test execution is a blocking system failure.

### Mathematical Paradigm Summary

The ARCH operational ontology is defined as a sequence of deterministic transformations over sequential observations, strictly bounded within the execution run:

$$\text{Sequential VCS Activity} \xrightarrow{\text{Phase 1}} \text{Ordered Events } O \xrightarrow{\text{Phase 2}} \text{Execution-Scoped Windows } W \rightarrow \text{Local Hypotheses } D \xrightarrow{\text{Phase 3}} \text{Transient Signals } S$$

---

## Phase 1 Invariants: The Ordered Syntactic Microscope

Phase 1 compiles VCS and filesystem activity into an ordered list of decontextualized events $O = \{e_1, e_2, \dots, e_N\}$ where sequence index $i$ represents sequential order.

```
[VCS Activity] ──(Ordering Preserved)──> Ordered Events O = {e1, e2, ...} (Time-blind, Decontextualized)
```

#### Invariants:
1. **$\mathcal{I}_{1.1}$ — Time Blindness**:  
   Events must not contain timestamps, time-relative offsets, or duration metrics. Time is strictly replaced by a sequence index representing local order within the batch:
   $$\forall e_i \in O, \quad \text{Time}(e_i) = \emptyset, \quad \text{Index}(e_i) = i \in [0, N-1]$$
2. **$\mathcal{I}_{1.2}$ — Semantic Blindness**:  
   Phase 1 outputs are strictly syntactic. Event structures must be named using purely structural or VCS-primitive terms (e.g. `file_write`, `exit_code`). No qualitative or interpretive terms are allowed:
   $$\text{Vocabulary}(O) \cap \{\text{failure}, \text{drift}, \text{success}, \text{risk}, \text{quality}, \text{efficiency}\} = \emptyset$$
3. **$\mathcal{I}_{1.3}$ — Local Identity Masking**:  
   Repository names, user names, git hashes, file paths, and code contents must be completely stripped and replaced by irreversible cryptographic hashes or generalized category names (e.g. `config_like`).

---

## Phase 2 Invariants: Execution-Bounded Window Inference

Phase 2 groups the ordered event stream $O$ into ephemeral, sequential windows $W = \{W_1, W_2, \dots, W_M\}$ and computes independent, competing local hypotheses $D_j$ for each window.

```
O = {e1, e2, ...} ──(Windowing)──> Ephemeral W1, W2 ──(Hypotheses)──> D1, D2 (Execution-Scoped State)
```

#### Invariants:
1. **$\mathcal{I}_{2.1}$ — Ephemeral Window Isolation**:  
   Windows are strictly bounded and non-referential. No fragment in Window $W_a$ may reference or link to any fragment in Window $W_b$:
   $$\forall a \neq b, \quad \text{Linkage}(W_a, W_b) = \emptyset$$
2. **$\mathcal{I}_{2.2}$ — Non-Accumulating State (Execution-Bounded Memory)**:  
   The hypothesis generation function $H: W_j \rightarrow D_j$ is permitted to maintain sequential state *within* the scope of the current execution batch. However, it is strictly prohibited from loading, reading, writing, or updating any persistent state or weights across distinct execution invocations:
   $$\text{State}(H)_{N+1} \cap \text{State}(H)_N = \emptyset$$
3. **$\mathcal{I}_{2.3}$ — Multi-Hypothesis Ambiguity Preservation**:  
   Phase 2 outputs must not collapse into a single "fact" or "truth". Every output $D_j$ must represent a distribution of competing explanations with descriptive weights:
   $$D_j = \{(h_1, w_1), (h_2, w_2), \dots\} \quad \text{where } \sum w_k = 1.0 \text{ and } |D_j| \ge 2$$

---

## Phase 3 Invariants: The Transient Actuation Projector

Phase 3 projects Phase 2's local uncertainty distributions $D_j$ into instantaneous operational signals $S_j$ within the active execution run.

```
D1, D2 ──(Stateless Projection)──> Instantaneous Signals S1, S2 ──(Actuation)──> Dissolution
```

#### Invariants:
1. **$\mathcal{I}_{3.1}$ — Stateless Projection (Zero Prior Memory)**:  
   Phase 3 is a pure function operating on the current execution-scoped window hypotheses $D_j$. It is prohibited from maintaining persistent priors or temporal smoothing across executions.
2. **$\mathcal{I}_{3.2}$ — Zero Local Prior Storage**:  
   No output of $P(D_j)$ may be written to disk, stored in memory variables between command executions, or cached for future reference.
3. **$\mathcal{I}_{3.3}$ — Complete Dissolution**:  
   Once the operational signals $S_j$ are actuated (e.g., triggering a local CLI alert or driving a sandboxed workflow interrupt), all intermediate metrics, distributions, and outputs are completely dissolved from runtime memory.

---

## Unified Adversarial Stress-Test Specifications

To guarantee these invariants are programmatically enforced, the codebase must pass two non-negotiable stress tests implemented in `cli/src/test/ts/corpus-stress-test.test.ts`:

### 1. The Latent Actor Reconstruction Test (Enforces $\mathcal{I}_{1.1} - \mathcal{I}_{1.3}$)
* **Protocol**: Compile a stream of 10,000 Phase 1 event records. Train or execute an optimization compression algorithm (e.g. Singular Value Decomposition or a sequence prediction model) to reconstruct distinct trajectories, developer workflows, or individual repo profiles.
* **Assertion**: The reconstructed information entropy of the stream must remain indistinguishable from white noise. The compression ratio must be close to 1:1, proving no stable latent behavior model can be reconstructed.

### 2. The Weight Isolation Test (Enforces $\mathcal{I}_{2.2}$)
* **Protocol**: Feed a highly structured, repeating, and biased sequence of event windows into the Phase 2 and Phase 3 pipelines. Execute the pipeline over 1,000 independent CLI invocations.
* **Assertion**: Verify the internal state registry of the execution engine. Proving that **no state, parameters, weights, or cached context** survives between execution $N$ and execution $N+1$. Memory must be strictly execution-scoped.

---

## Consequences

**Positive:**
* Mathematically and physically consistent with the properties of software systems.
* Preserves sequence order and causal identifiability while enforcing strict epistemic safety.
* Verifiable security: the stress-test suite programmatically guarantees absolute non-persistence across CLI executions.

**Negative / trade-offs:**
* Temporal smoothing and alert hysteresis must be handled entirely outside the core engine (e.g. using standard OS job schedulers or simple shell script wrapping).

---

## Referenced-by
**Files:** cli/src/main/ts/domain/services/
**Note:** Epistemic invariant specification — task-validator enforces invariants
