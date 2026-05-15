# IDEA: fix-archive-meta-drift
**Meta:** Source: Phase-3 | Status: DRAFT | Size: S | Sessions: 0

### Problem
`arch report` failed with CRITICAL INTEGRITY BREACH because of malformed meta lines in `docs/archive/`.
Example: `TASK-888.md` has an empty size field (`P1 | | DONE`).

### Proposed Solution
1. Identify all malformed meta lines in `docs/archive/`.
2. Backfill missing fields (Size, Class, etc.) based on context or history.
3. Harden `arch review` to ensure NO task is archived with a malformed meta line (pre-archive guard).

### Constraint axes
- Dependency ordering: Satisfied.
- Temporal validity: Satisfied.
- Abstraction layer: Satisfied.
- Observability validity: Satisfied.
- Priority displacement: Satisfied (P0 Integrity).
