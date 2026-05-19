## TASK-265: Add ExcisionStructuralCheck to DriftChecker for deletion traceability
**Meta:** P1 | S | READY | Focus:yes | 2-code-generation | claude | cli/src/main/ts/application/use-cases/drift-checker.ts

### Context

EscalationMaturity currently treats protected-path deletions the same as additions, requiring an ADR even for well-traced removals. This creates selection pressure toward accumulation. An `ExcisionStructuralCheck` with three gates (reference-clean, decision-record exists, build-clean) allows legitimate excisions to pass without an ADR while catching structurally incomplete removals.

### Acceptance Criteria

- [ ] `DriftChecker` implements `ExcisionStructuralCheck` with Gate 1 (reference-clean), Gate 2 (decision-record exists), and Gate 3 (build-clean) logic.
- [ ] Protected-path deletions passing all 3 gates emit `ExcisionCheck: PASS` and do not require an ADR; failures emit `ExcisionCheck: FAIL` with an ADR requirement.
- [ ] `arch review` passes.  →  cmd: arch review; exit: 0

### Definition of Done

- [ ] `ExcisionStructuralCheck` implemented in DriftChecker with correct PASS/FAIL/WARN result logic.
- [ ] `arch review` passes.
