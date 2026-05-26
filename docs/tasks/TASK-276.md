## TASK-276: Implement AI-proposed policy generation from pattern analysis in THINK mode
**Meta:** P3 | M | REJECTED | Focus:no | 6-writing | claude | docs/refinement/, docs/guidelines/

### Context

Guidelines are currently written reactively after failures. ARCH has sufficient operational history to detect recurring failure patterns proactively. This task adds pattern analysis to THINK mode that generates proposed guidelines as IDEAs with `Source: AI-pattern-detection` when recurring failure classes are detected (e.g., 7 auth tasks failed REVIEW for the same reason).

### Acceptance Criteria

- [ ] THINK mode analysis includes a step that scans retros, KAIZEN-LOG, and task failure patterns for recurring failure signatures.
- [ ] When a recurring failure class is detected (configurable threshold), THINK generates a proposed guideline IDEA in `docs/refinement/` with `Source: AI-pattern-detection`.
- [ ] `arch review` passes.  →  cmd: arch review; exit: 0

### Definition of Done

- [ ] AI-proposed policy generation logic implemented in THINK mode protocol and/or CLI.
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
