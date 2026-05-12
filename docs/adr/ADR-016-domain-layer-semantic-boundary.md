# ADR-016: Define the semantic boundary of the domain layer

**Date:** 2026-05-12
**Status:** ACCEPTED
**Deciders:** Valentín Liñeiro

---

## Context

`cli/src/main/ts/domain/` contained a mix of true domain models (`models/`, `repositories/`) and operational enforcement services (`drift-checker.ts`). The protected path in `arch.config.json` covered the entire `domain/` directory, causing EscalationMaturity to fire on structural governance changes — the opposite of what protection is for.

`drift-checker.ts` depends on `FileSystem` and `GitRepository` (infrastructure), is consumed exclusively by the `application/` layer, and enforces structural invariants rather than representing business rules. It is not a domain model.

## Decision

`domain/` means: models, value objects, repository interfaces, and services whose logic is derived purely from business rules with no infrastructure dependencies. Operational enforcement services (drift checking, system review) belong in `application/use-cases/`.

Protected paths are narrowed to `cli/src/main/ts/domain/models/` and `cli/src/main/ts/domain/repositories/` — the actual domain core.

## Rationale

- The original broad protection of `domain/` was implicit, not designed. No prior ADR defined what belongs there.
- Protecting `domain/services/` indiscriminately means any service placed there, correctly or not, becomes "protected by proximity."
- The correct invariant is: the domain model (types, contracts, pure business logic) should not change without architectural review. Infrastructure-aware services should not.

## Consequences

**Positive:**
- EscalationMaturity fires only on actual domain model changes
- `drift-checker.ts` and future enforcement services can evolve in `application/use-cases/` without governance friction
- The semantic meaning of `domain/` is now explicit and enforceable

**Negative / trade-offs:**
- `domain/services/` is no longer uniformly protected; files placed there in the future are not automatically shielded
- Requires auditing remaining `domain/services/` files for correct placement (follow-up, not blocking)

---
<!-- Once ACCEPTED, this ADR is permanent. -->
<!-- To reverse: create a new ADR that supersedes this one. -->
<!-- Reference in tasks: ADR-016 — no need to re-read, decision is final -->
