# ARCH Epistemic Context Axioms (Option B: Observable Causal System)

This document defines the formal invariants and cybernetic control boundaries of the ARCH context-indexing and retrieval engine. ARCH is specified as an **Observable Causal System (Option B)**: heuristics and soft influence are allowed, but they must be fully traceable, explainable, and isolated from absolute write-paths.

---

## 1. Core Axioms

* **Axiom 1 — Facts are durable:** Raw facts (AST trees, imports, exports, git hashes, raw markdown text) are persistent, immutable, and deterministic. They carry no institutional semantics.
* **Axiom 2 — Inference is contextual:** Relationships, semantic mappings, and inferences (probabilistic or deterministic) are transient, scoped, and fully invalidable.
* **Axiom 3 — Governance authority cannot emerge from heuristic accumulation:** Statistical heuristics or keyword overlaps never establish governance boundaries or enforcement rules automatically. Elevating an inference to governance fact requires explicit human adjudication (Auditor / ADR decider) and a fully auditable causal trace.

---

## 2. Invariants & Control Boundaries

### Invariant A: Determinism via Canonicalization & Longitudinal Stability
* *Invariant:* Deterministic derivations (`derived/deterministic/`) are reproducible **only after passing through a canonicalization function**.
* *Longitudinal Stability:* Simple local determinism is insufficient. To prevent *canonicalization drift* (where changes in key sorting, parser behaviors, or traversal sequences break historical comparability), we introduce `canonicalizationVersion`.
* *Rule:* Any change to the canonicalization algorithm, traversal sequence, or AST parsing behavior increment the `canonicalizationVersion`, immediately invalidating all historical projections and deterministic derivations globally.

### Invariant B: Heuristic Isolation & Soft Influence Limits
* *Hard path boundary:* Heuristics are strictly prohibited from entering the write-path or serving as input to Layer 1 verification models:
  $$\text{Heuristics} \cap \text{Write-Path} = \varnothing$$
* *Soft path boundary (Indirect Leakage):* Heuristics may influence attention, cognitive prioritization, and search selection. However, to prevent *indirect authority leakage* (where a biased heuristic ranking forces a human operator to make a matching manual governance write), **soft influence must be explicitly bounded and trace-logged**.

---

## 3. The Causal Trace Layer

To achieve **complete causal auditability**, every query or operation utilizing heuristic context inference must output a structured, auditable **Causal Trace**. It is not enough to record *what* context was injected; we must record *why* and *under what influence weights*.

### The Causal Trace Contract:
```typescript
interface CausalTrace {
  readonly traceId: string;
  readonly taskId: string;
  readonly activeCausalNeighborhood: {
    readonly hotSeeds: string[]; // ADRs or files that triggered this neighborhood
    readonly expansionPath: string[]; // How the graph expanded (e.g. imports, task ancestry)
  };
  readonly heuristicInputs: Array<{
    readonly inferenceId: string;
    readonly model: string;
    readonly confidence: number;
    readonly weight: number; // Applied influence weight
    readonly signals: string[]; // e.g. ["overlap:context", "retro:failure"]
  }>;
  readonly humanDecisionOverride: boolean; // Did the operator override this suggestion?
  readonly timestamp: string;
}
```
All runtime context injections MUST append an entry to `.arch/context/trace-log.jsonl`.

---

## 4. Multi-Axis Invalidation & Epoch Versioning

To ensure complete control of the epistemic lifecycle, the system splits identity and versioning in `schema-version.json` into five distinct axes:
* `schemaVersion`: Representation format structure.
* `operatorVersion`: Execution logic and extraction code version.
* `projectionVersion`: Ontological/governance class criteria mapping version.
* `canonicalizationVersion`: Stable serialization format identity.
* `heuristicModelVersion`: Active probabilistic and semantic inference model version.

Any mismatch on a specific axis triggers a selective, automated wipe of the corresponding subdirectories under `.arch/context/`.

---

## 5. Epistemic Regression Testing

ARCH rejects typical unit-testing as a guarantee of system correctness. The runtime MUST run **Epistemic Regression Tests**:
1. **Semantic Divergence Test:** Given the same repository facts, when `operatorVersion` or `projectionVersion` changes, the system must verify that projections and heuristic weights diverge deterministically in compliance with the new rules.
2. **Causal Lineage Stability:** Verification that an older, causally dominant ADR remains within the "Hot" active causal neighborhood of a newly generated task if that task violates its transitive dependencies.
