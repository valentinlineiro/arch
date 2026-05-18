## TASK-282: Implement structural policies - declarative architectural boundaries in arch review
**Meta:** P2 | M | READY | Focus:no | 2-code-generation | claude | cli/src/main/ts/application/use-cases/drift-checker.ts, arch.config.json

### Context

Architectural constraints (forbidden dependencies, naming conventions, required test coverage, module boundary rules) are stated in guidelines but not enforced. Guidelines alone are not governance per P-003. This task implements declarative structural policies in `arch.config.json` that are checked by `arch review` as WARN or ERR, applying the same severity semantics as existing drift checks.

### Acceptance Criteria

- [ ] `arch.config.json` supports a `policies` block with at least `forbiddenDependencies`, `requiredTestCoverage`, and `namingInvariants` fields.
- [ ] `arch review` checks each declared policy and emits WARN or ERR violations consistent with existing drift check semantics.
- [ ] `arch review` passes.  →  cmd: arch review; exit: 0

### Definition of Done

- [ ] Structural policy engine implemented in DriftChecker reading from arch.config.json policies block.
- [ ] `arch review` passes.

## Hansei
**Severity:** H0
**Category:** [SpecDrift]

**Decision:**
Task created at promotion time; no implementation decisions made yet.

**Constraint:**
Hansei fields populated at creation to satisfy pre-commit linter requirement for M+ tasks.

**Cost:**
No implementation cost incurred at this stage.

**Forward Action:**
Real Hansei to be written at REVIEW time per ADR-019.
