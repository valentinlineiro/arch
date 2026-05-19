## TASK-261: Define cross-layer coverage identity model for drift signals and IDEAs
**Meta:** P2 | S | READY | Focus:yes | 6-writing | claude | docs/refinement/, cli/src/main/ts/application/use-cases/drift-checker.ts

### Context

ARCH's observation layer (DriftChecker signals) and intervention layer (IDEAs) are semantically coupled but have no shared identity primitive. The system cannot mechanically determine whether a drift signal is already covered by a pending IDEA, leading to potential duplicate IDEAs and unverifiable backlog completeness. This task defines the identity model (Option A, B, or C) before any implementation.

### Acceptance Criteria

- [ ] An ADR or design document in `docs/adr/` or `docs/refinement/` specifies the chosen coverage identity model (IDEA-centric, drift-centric, or relational primitive) with rationale.
- [ ] The chosen model is unambiguous enough to guide downstream implementation of coverage queries.
- [ ] `arch review` passes.  →  cmd: arch review; exit: 0

### Definition of Done

- [ ] Coverage identity model decision recorded as an ADR or design document.
- [ ] `arch review` passes.
