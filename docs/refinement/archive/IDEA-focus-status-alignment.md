# IDEA: focus-status-alignment
**Meta:** Source: Phase-2.5 | Status: DRAFT | Size: XS | Sessions: 1

### Problem
Discovered drift between task `Status` and `Focus` field during THINK Phase 1/2.5.
- `TASK-247` is `IN_PROGRESS` but has `Focus:no`.
- `TASK-245` is `READY` but has `Focus:yes`.

This violates the system lifecycle invariants in `AGENTS.md`. `arch govern` or manual edits have introduced inconsistent state.

### Proposed Solution
Harden `arch govern` and `arch review` to detect and fix these mismatches:
1. `arch review` should FAIL if a task is `IN_PROGRESS` but `Focus:no`.
2. `arch review` should FAIL if a task is `READY` or `BLOCKED` but `Focus:yes`.
3. `arch govern` should be the only authority to set `Focus:yes`.

### Constraint axes
- Dependency ordering: Satisfied.
- Temporal validity: Satisfied (empirical drift observed).
- Abstraction layer: Satisfied (governance layer).
- Observability validity: Satisfied.
- Priority displacement: Satisfied (P1 correctness).

## Decision
PROMOTE → TASK-903
