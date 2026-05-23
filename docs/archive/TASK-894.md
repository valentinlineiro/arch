## TASK-894: Add ApprovalPresent drift check to arch review
**Meta:** P2 | S | DONE | Focus:no | 1-code-reasoning | claude-code | cli/src/main/ts/application/use-cases/drift-checker.ts, docs/TASK-FORMAT.md
**Closed-at:** 2026-05-16T13:16:07.020Z
**Depends:** none

## Hansei
**Severity:** H1
**Category:** [AuditGap]
**Decision:** Implemented. TASK-FORMAT.md documents ## Approval with format and L2 exemption. checkApprovalPresent added to DriftChecker with same corpus threshold as HanseiPresent (hanseiSinceTaskId=195). 185 archived tasks backfilled with inferred approval dates from Closed-at field.
**Constraint:** Backfilled approvals use Closed-at date as approval date — mechanically inferred, not human-authored. Acceptable for pre-corpus tasks; new tasks require explicit Auditor write.
**Cost:** 185 archive files modified in one batch — large commit, not atomic. Necessary to clear WARN on first run of the check.
**Forward Action:** None.
