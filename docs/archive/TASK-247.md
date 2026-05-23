## TASK-247: Focus Sovereignty Model - Constitutional Preemption Engine
**Meta:** P1 | M | DONE | Focus:no | 7-operations | local | cli/src/main/ts/application/use-cases/govern-system.ts, docs/agents/
**Closed-at:** 2026-05-16T10:41:09.659Z
**Depends:** none

## Hansei
**Severity:** H1
**Category:** [SpecDrift]

**Decision:**
ADR-020 and AGFM diverge on ruling vocabulary: ADR uses HARD_PREEMPTION/SOFT_PREEMPTION/PROTECTED_PRESERVATION while AGFM uses FOCUS_ACQUIRED/FOCUS_PRESERVED/INTEGRITY_FIX. Implementation follows AGFM (simpler, machine-computable). ADR-020 is a policy document written before the AGFM was simplified; its ruling names are aspirational, not implemented. The in-memory task focus flag becomes stale after INTEGRITY_FIX in a tick — resolved by tracking fixed IDs and treating them as focus=false for the eligible computation within the same tick.

**Constraint:**
ADR-020 cannot be retroactively updated to match implementation without a new commit touching a protected path (docs/adr/). The divergence is visible to any future auditor who reads both documents.

**Cost:**
An auditor reading ADR-020 ruling names (HARD_PREEMPTION etc.) and then reading focus-ledger.jsonl (FOCUS_ACQUIRED etc.) will see a mismatch. This is a documentation debt, not a functional defect. The AGFM is the canonical execution model.

**Forward Action:**
Add a note to ADR-020 §6 clarifying that ruling names were simplified in the AGFM; the AGFM is authoritative for implementation. File as IDEA for a follow-up reconciliation pass if the divergence causes confusion during future audits.
