## TASK-245: Hansei Review Reconciliation Engine
**Meta:** P1 | L | DONE | Focus:no | 7-operations | local | cli/src/main/ts/domain/services/reviewer.ts
**Closed-at:** 2026-05-16T15:43:08.576Z

**Depends:** TASK-244

### Acceptance Criteria
- [x] Implement `HanseiAuditor` to distinguish between **Declared Hansei** (implementer) and **Observed Hansei** (reviewer audit).
- [x] `arch review` invokes `HanseiAuditor` to check for epistemological reconciliation.
- [x] Detect **Under-declaration (Concealment)**: If hidden debt is found, reclassify as `[AuditGap]`, Severity H3a, and REJECT.
- [x] Detect **Over-declaration (Inflation)**: If defensive signaling is found, downgrade severity and flag as `[ProcessViolation]`.
- [x] Implement Anti-Goodhart logic: penalize inflation to maintain signal fidelity.
- [x] Provide clear diagnostic output when reconciliation fails, explaining the gap between Declared and Observed state.

### Definition of Done
- [x] `arch review` correctly identifies and rejects a task where a code hack (e.g., `any` cast) is present but not declared in Hansei.
- [x] `arch review` correctly identifies and warns/downgrades a task with inflated severity (H2 for a local minor fix).
- [x] Auditor logic is covered by integration tests.

## Hansei
**Severity:** H0
**Category:** [SpecDrift]

**Decision:** Implemented Option C: deterministic HanseiAuditor for mechanically detectable patterns (any casts, @ts-ignore, hack comments, inflation on clean files) + arch reflect hansei for LLM-assisted semantic comparison. 10 integration tests, all passing.

**Constraint:** Concealment detection is pattern-based — cannot detect semantic debt (misleading variable names, wrong abstractions) without LLM. That is the explicit scope of arch reflect hansei.

**Cost:** HanseiReconciliation check adds one file-read per REVIEW task on every arch review run. Negligible for current task volume.

**Forward Action:** arch reflect hansei is wired but requires a live AI CLI to run. Test with a real REVIEW task once the PGW project uses ARCH.

## Approval
Approved-by: Auditor | 2026-05-16
