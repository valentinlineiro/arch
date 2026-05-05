# ADR-006: Depends Graph Validation in DriftChecker Domain Service

**Date:** 2026-05-05
**Status:** ACCEPTED
**Deciders:** Valentín Liñeiro

---

## Context

`Depends:` fields in task files were not validated. A task could reference a non-existent TASK-ID or form a cycle that silently blocked the backlog with no feedback from `arch review`.

## Decision

Extend `DriftChecker` (domain service) with a `DependsGraph` check that validates all `Depends:` references exist in `docs/tasks/` or `docs/archive/`, and detects circular dependencies in the active task graph.

## Rationale

- `DriftChecker` already owns all structural task validation; this is a natural extension of its responsibility.
- Keeping graph validation in the domain layer keeps it testable in isolation and reusable by any application use case that calls `DriftChecker`.
- Alternatives considered: a separate validator script (increases surface area) or a CLI-layer check (breaks layering, harder to test).

## Consequences

**Positive:**
- Invalid references and cycles surface immediately in `arch review` output.
- Domain layer remains the single source of truth for task graph integrity.

**Negative / trade-offs:**
- Any future change to `DriftChecker` (also a protected path) requires an ADR, increasing overhead for incremental additions.

---
<!-- Once ACCEPTED, this ADR is permanent. -->
<!-- To reverse: create a new ADR that supersedes this one. -->
<!-- Reference in tasks: ADR-006 — no need to re-read, decision is final -->
