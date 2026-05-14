# ADR-013: Two-Tier Drift Detection Architecture

**Date:** 2026-05-07
**Status:** ACCEPTED
**Deciders:** Valentín Liñeiro

---

## Context

ARCH needed to detect five categories of organizational drift: orphan tasks, obsolete guideline references, unapplied ADRs, contradictory guidelines, and structural repetition. A naive approach would add all five as checks in DriftChecker, but three of the five (contradictions, repetition, ADR conceptual drift) require semantic analysis that cannot be made deterministic or reproducible by a rule-based TypeScript parser.

Mixing deterministic and probabilistic checks in the same enforcement layer creates a system where some WARNs are reproducible and some are opinion-dependent, making the tool unreliable as an audit gate.

## Decision

Split drift detection into two tiers with distinct responsibilities:

**Tier 1 — DriftChecker (deterministic enforcement layer):** three new mechanical checks are added: `checkOrphanTasks` (directed graph reachability from active root set), `checkObsoleteGuidelines` (dead path references in guideline files), `checkUnappliedADRs` (ACCEPTED ADRs with no task reference). All three are 100% deterministic, reproducible, and audit-able.

**Tier 2 — THINK Phase 2.5 (Semantic Drift Analysis):** a new phase in the THINK protocol handles contradictions, structural repetition, and ADR conceptual drift using LLM reasoning. Phase 2.5 (Semantic Drift Analysis) produces IDEA files for the refinement queue — it never writes to DriftChecker output, never blocks `arch review`, and never creates tasks directly.

## Rationale

- **Reproducibility:** `arch review` is used as an audit gate and must be deterministic. Introducing LLM-based checks would make results non-reproducible across runs.
- **Separation of concerns:** DriftChecker answers "is the system structurally broken?" THINK Phase 2.5 (Semantic Drift Analysis) answers "is the system evolving inconsistently?" These are different questions requiring different tools.
- **Auditability:** Every DriftChecker WARN can be traced to a specific line of parsed text. THINK Phase 2.5 (Semantic Drift Analysis) findings are insights, not violations.

## Consequences

**Positive:**
- DriftChecker remains a pure truth layer — fully deterministic, zero LLM dependency.
- Semantic analysis is available through THINK without polluting the enforcement model.
- The Active Root Set definition (READY + IN_PROGRESS + REVIEW tasks) is explicit and auditable.

**Negative:**
- Semantic drift findings are visible only when THINK runs — not on every `arch review`.
- Contradictions and structural repetition are not caught automatically by the CLI.

**Extension points:**
- When `docs/intents/` is introduced with CAPTURED/PROMOTED statuses, those nodes extend the DriftChecker active root set as the true causal origin of the system.
- IDEA source typing (`Source: phase-3 | phase-3.5`) should be formalized when the refinement queue scales.
