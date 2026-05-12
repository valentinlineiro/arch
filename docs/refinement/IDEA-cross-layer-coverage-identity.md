# IDEA: cross-layer-coverage-identity
**Created:** 2026-05-12
**Source:** Diagnostic session — drift/IDEA semantic coupling without structural unification
**Status:** DRAFT
**Sessions:** 1
**Meta:** P2 | M | local | docs/refinement/ + cli/src/main/ts/application/use-cases/drift-checker.ts

## Problem

ARCH operates two structurally independent layers that are semantically coupled:

- **Observation layer** (DriftChecker): emits named signals — `UnappliedADRs`, `HanseiPresent`, etc.
- **Intervention layer** (IDEAs): declares intent to address problems, including problems named by those signals

The property "this drift signal is covered by this IDEA" is currently not machine-representable. It is only inferable — by reading both layers and interpreting similarity of subject matter. That means:

- A future THINK session re-reading drift output may generate a duplicate IDEA for an already-tracked problem
- The system cannot distinguish "unhandled drift" from "drift already addressed by pending IDEA"
- "Backlog completeness" is not verifiable — coverage is opaque to the system itself
- Governance closure ("this signal has been resolved") cannot be declared mechanically

This is not a queryability gap alone. It is a cross-layer identity resolution gap: the two layers have no shared identity primitive for the same governance subject.

## What this is NOT

This IDEA does not address:
- Query syntax for `arch ask`
- Refinement queue display logic
- INBOX regeneration
- Deduplication heuristics

Those would be downstream of a resolved identity model. Implementing any of them before the identity model is defined would silently choose an ontology without naming it.

## Unresolved: identity model for coverage

Three structurally distinct options exist. This IDEA does not choose between them — choosing prematurely is the failure mode this IDEA is designed to prevent.

**Option A — IDEA-centric**
Coverage is a metadata property of interventions. An IDEA declares: `Covers: DriftSignal/UnappliedADRs`. The drift layer is unmodified. Lookup direction: given signal, find IDEAs declaring coverage.

*Consequence*: drift signals remain pure observation objects. Coverage is an assertion made by the intervention layer. A signal with no covering IDEA is provably unclaimed.

**Option B — Drift-centric**
Coverage is an annotation on signals. DriftChecker output can be marked `covered_by: IDEA-link-unapplied-adrs`. The IDEA layer is unmodified. Lookup direction: given IDEA, check whether its target signal is annotated.

*Consequence*: observation layer becomes partially mutable (annotations must be updated when IDEAs change state). Drift signals carry intervention state, coupling the layers in a different way.

**Option C — Relational primitive (third object)**
Coverage is a first-class entity that links an observation-layer subject to an intervention-layer subject. Neither layer is modified; a mapping layer asserts equivalence: `{signal: UnappliedADRs, intervention: IDEA-link-unapplied-adrs, status: pending}`.

*Consequence*: cleanest separation, but introduces a third ontological entity. Adds complexity that is only justified if the system regularly needs to query coverage from both directions.

The choice between A, B, and C determines whether future governance remains compositional or becomes entangled. This is an architecture decision, not an implementation decision, and it cannot be made before the query layer (`arch ask` v1) is operational — because the semantics of coverage lookups determine which model is even expressible.

## Structural admissibility (5-axis)

| Axis | Status | Note |
|------|--------|------|
| Dependency ordering | **Violated** | Requires `arch ask` v1 for query semantics to be expressible. Full implementation blocked. |
| Temporal validity | Satisfied | Problem is observable now — two concrete instances exist (ADR signal, Hansei signal). |
| Abstraction layer | Satisfied | Cross-layer identity primitive is the correct layer; cannot be solved inside either existing layer alone. |
| Observability validity | Partially satisfied | The symptom is observable (coverage cannot be determined mechanically); the measurement of "governance closure rate" requires query infrastructure that doesn't exist yet. |
| Priority displacement | **Active** | IDENTITY.md §6 locks `arch ask` v1 as priority 2. This work is downstream of that. |

**Structural admissibility:** not yet satisfied. Two axes violated. Full design blocked until `arch ask` v1 is operational.

## What this IDEA is for

This stub exists to:
1. Prevent re-derivation — the problem has been diagnosed, documented, and placed in the queue
2. Preserve the open question — the identity model decision is explicitly deferred, not silently answered
3. Mark the dependency — any work that adds coverage-like behavior to either layer before this IDEA is resolved is implicitly choosing an ontology without authorization

## Decision

