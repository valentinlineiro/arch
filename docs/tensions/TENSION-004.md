# TENSION-004: Chronicle write/synthesize symmetry
**Detected:** 2026-05-12
**Detected by:** human
**Status:** open
**Impact class:** epistemic
**Causal edge:** none

---

## Legitimacy gate

- [x] **Concrete actor**: A contributor adding or deriving edges in the causal graph using `arch causal`.
- [x] **Named invariant**: Signal → Arbitration → Truth pipeline (per ADR-014 and ADR-015).
- [x] **Probable, not merely imaginable**: `arch causal add` and `arch causal synthesize` share a symmetric command surface but represent fundamentally different epistemic operations (assertion vs. derivation).
- [x] **Asymmetric damage**: Contamination of the committed truth layer with unverified or misclassified inferences. Bypass of the human/auditor arbitration gate required for belief assertions.

---

## Boundary
Human-authored belief assertion (`add`) vs. Rule-based belief derivation (`synthesize`).

## Current ambiguity
The naming symmetry in the `arch causal` command surface suggests these are interchangeable write operations to a causal database.

## Likely misuse
A contributor uses `arch causal add` to record a derived inference that should have been subjected to the `synthesize` rules, or vice versa, bypassing the intended epistemological boundary.
Rationalization: "Because both commands result in a new edge in `causal-graph.jsonl`, it doesn't matter which one I use to record this relationship."

## Violation risk
Loss of epistemic integrity. The system cannot distinguish between verified human beliefs and unverified machine derivations, making it impossible to audit the source of "truth" in the graph.

## Preventive invariant
A structural separation between assertion and derivation paths, ensuring that human-authored beliefs are always subjected to arbitration while machine-derived edges are labeled as synthetic.

## Required correction
Disambiguate the command surface (e.g., `assert` vs `derive`). Update the causal graph schema to enforce labeling of edge origins.

## Resolution
[Filled when Status moves to frozen or watching]
