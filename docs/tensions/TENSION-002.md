# TENSION-002: Additive legitimacy bias in DriftChecker
**Detected:** 2026-05-12
**Detected by:** human
**Status:** open
**Impact class:** structural-governance
**Causal edge:** none

---

## Legitimacy gate

- [x] **Concrete actor**: A contributor attempting to delete a dead module (e.g., the removal of `INTENT` domain model).
- [x] **Named invariant**: `EscalationMaturity` (protected path check) in `arch review`.
- [x] **Probable, not merely imaginable**: The current design uses a binary "protected path modified → ADR required" check that cannot distinguish deletion from additive modification.
- [x] **Asymmetric damage**: Structural selection pressure toward accumulation (ontological bloat). Subtraction is discouraged by audit friction, leading to system entropy. Irreversible without explicit structural vocabulary for excision.

---

## Boundary
Ontological addition vs. Ontological subtraction in governance audit vocabulary.

## Current ambiguity
The `EscalationMaturity` check in `DriftChecker` uses a single binary gate: any change to a protected path (domain models, repositories) requires a corresponding ADR.

## Likely misuse
A contributor decides to retain a dead or redundant artifact (module, model, or doc) instead of deleting it, specifically to avoid the governance overhead of writing an ADR for a "clean" deletion.
Rationalization: "Because removing this file triggers a governance failure that I don't have the time to resolve with an ADR right now, I'll just leave the dead code in place."

## Violation risk
`EscalationMaturity` false positive blocks legitimate system simplification. The invariant intended to protect architectural integrity instead enforces architectural accumulation.

## Preventive invariant
Excision structural consistency must be evaluated by a separate gate (`ExcisionStructuralCheck`) that validates the *quality* of the deletion rather than its presence.

## Required correction
Implementation of `ExcisionStructuralCheck` in `DriftChecker` to handle protected path deletions via a three-gate test (Reference-clean, Decision-record exists, Build-clean). Linked to [IDEA-excision-legitimacy-check](../refinement/IDEA-excision-legitimacy-check.md).

## Resolution
[Filled when Status moves to frozen or watching]
