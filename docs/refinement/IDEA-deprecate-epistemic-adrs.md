# IDEA: Deprecate ADR-026/027/028 when causal graph code is removed

**Status:** DRAFT
**Created:** 2026-06-03
**Source:** Protocol audit — three ADRs govern architecture being considered for removal
**Candidate-class:** 6-writing
**Candidate-size:** XS
**Depends:** IDEA-remove-causal-graph
**Decision:** Pending human review.

## Problem

ADR-026 (Epistemic Layer Separation), ADR-027 (Bounded Stream Projections), and ADR-028 (Unified Epistemic Invariant Specification) define the architecture for the causal graph, UEG layer, and epistemic separation between domains. If IDEA-remove-causal-graph and IDEA-remove-ueg-layer are promoted, the code these ADRs govern will no longer exist. Keeping the ADRs as ACCEPTED creates confusion — they describe enforced invariants for systems that have been removed.

## Proposed solution

When causal graph and UEG code is removed: update ADR-026/027/028 status to DEPRECATED with a note referencing the removal decision. Move to docs/adr/archive/. Do not delete — they are historical record of what was tried and why it was removed.

## Validation hints

- ADR-026/027/028 status updated to DEPRECATED after causal graph removal
- Deprecation note references the task that removed the code
- Files moved to docs/adr/archive/
