# TENSION-003: Capability-triggered state transition missing from IDEA lifecycle
**Detected:** 2026-05-12
**Detected by:** think
**Status:** open
**Impact class:** structural-lifecycle
**Causal edge:** none

---

## Legitimacy gate

- [x] **Concrete actor**: `IDEA-context-control` (and similar capability-gated proposals).
- [x] **Named invariant**: IDEA lifecycle (DRAFT / PROMOTED / REJECTED / STALE) and TTL-archival policy.
- [x] **Probable, not merely imaginable**: The lifecycle is missing a state for "Valid but blocked by missing system capability," leading to the silent archival of structurally sound ideas.
- [x] **Asymmetric damage**: Silent loss of validated architectural work (false negatives). The loss is invisible, unlike duplication, and causes the system to "forget" its own refinement progress.

---

## Boundary
IDEA lifecycle state (static/temporal) vs. System capability state (runtime/operational).

## Current ambiguity
The current IDEA state machine (DRAFT → PROMOTED/REJECTED/STALE) does not account for external capability dependencies. If a human cannot promote an IDEA because the system cannot yet execute it (e.g., missing `arch ask` v1), the IDEA simply expires via TTL.

## Likely misuse
A structurally valid and "structurally admissible" IDEA is archived as "STALE" because the time-to-live expired while it was waiting for a required feature to be built.
Rationalization: "Because this IDEA has been in DRAFT for 4 sessions without a human Decision, it must be stale," ignoring that the decision was rationally deferred until a capability existed.

## Violation risk
Work continuity and auditability. The system loses valid refinements because its state machine has no vocabulary for "latent validity."

## Preventive invariant
An IDEA must not be archived by TTL if it is explicitly blocked by a missing system capability that is recorded in its dependency graph.

## Required correction
Update the IDEA lifecycle to include a "Latent" or "Capability-Gated" state. Update `arch reflect` to recognize capability-bound IDEAs and suppress TTL archival for them.

## Resolution
[Filled when Status moves to frozen or watching]
