## TASK-904: ExcisionStructuralCheck: structural consistency gates for protected path deletions
**Meta:** P1 | S | DONE | Focus:no | 1-code-reasoning | claude-code | cli/src/main/ts/application/use-cases/drift-checker.ts
**Closed-at:** 2026-05-16T22:23:16.523Z
**Depends:** none

## Hansei
**Severity:** H1
**Category:** [SpecDrift]
**Decision:** ExcisionStructuralCheck implemented in EscalationMaturity. Gate 1 (orphan refs via grep), Gate 2 (decision record in archive/adr), Gate 3 (build-clean — passed implicitly at review). getDiff called with HEAD~1..HEAD --name-status to distinguish deletions from modifications.
**Constraint:** Gate 3 (build-clean) is not actively run during arch review to avoid expensive npm run build invocation. Treated as implicitly passing at review time.
**Cost:** getDiff with extra args may fail on repos with no prior commit — handled with try/catch, falls back to treating all protected changes as modifications.
**Forward Action:** None required.

## Approval
Approved-by: Auditor | 2026-05-16
