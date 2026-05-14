## TASK-245: Hansei Review Reconciliation Engine
**Meta:** P1 | L | READY | Focus:yes | 7-operations | local | cli/src/main/ts/domain/services/reviewer.ts

**Depends:** TASK-244

### Acceptance Criteria
- [ ] Implement `HanseiAuditor` to distinguish between **Declared Hansei** (implementer) and **Observed Hansei** (reviewer audit).
- [ ] `arch review` invokes `HanseiAuditor` to check for epistemological reconciliation.
- [ ] Detect **Under-declaration (Concealment)**: If hidden debt is found, reclassify as `[AuditGap]`, Severity H3a, and REJECT.
- [ ] Detect **Over-declaration (Inflation)**: If defensive signaling is found, downgrade severity and flag as `[ProcessViolation]`.
- [ ] Implement Anti-Goodhart logic: penalize inflation to maintain signal fidelity.
- [ ] Provide clear diagnostic output when reconciliation fails, explaining the gap between Declared and Observed state.

### Definition of Done
- [ ] `arch review` correctly identifies and rejects a task where a code hack (e.g., `any` cast) is present but not declared in Hansei.
- [ ] `arch review` correctly identifies and warns/downgrades a task with inflated severity (H2 for a local minor fix).
- [ ] Auditor logic is covered by integration tests.

## Hansei
**Severity:** H0
**Category:** [SpecDrift]

**Decision:**
Focused per constitutional preemption.

**Constraint:**
Metadata update only; task remains in READY status.

**Cost:**
None. Staged metadata update for focus-sovereignty alignment.

**Forward Action:**
No forward action required for this metadata change.
