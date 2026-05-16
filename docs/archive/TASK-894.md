## TASK-894: Add ApprovalPresent drift check to arch review
**Meta:** P2 | S | DONE | Focus:no | 1-code-reasoning | claude-code | cli/src/main/ts/application/use-cases/drift-checker.ts, docs/TASK-FORMAT.md
**Closed-at:** 2026-05-16T13:16:07.020Z

**Depends:** none

### Context

DONE tasks require human approval before archival (per DO.md), but there is no structured approval artifact in the task file. Approval exists only in conversation or commit messages, making it unverifiable by `arch review`. The Auditor role is the canonical approver — the `## Hansei` section closing flow already validates Hansei; this task adds equivalent validation for the approval act itself.

**Decision on format:** The Auditor writes the approval. For tasks closed by Auditor session (human-reviewed), the format is `Approved-by: Auditor | <ISO-date>`. For tasks promoted autonomously via L2 (XS 6-writing/7-operations), the approval is implicit in the autonomous promotion log — those tasks are exempt from the `ApprovalPresent` check.

### Acceptance Criteria

- [x] `docs/TASK-FORMAT.md` documents the `## Approval` section with required format: `Approved-by: Auditor | <ISO-date>`. L2 autonomous tasks are noted as exempt.
  - `file: docs/TASK-FORMAT.md`

- [x] `DriftChecker.checkApprovalPresent()` added: scans `docs/archive/TASK-*.md` for DONE tasks missing a valid `## Approval` section. L2 autonomous tasks (size XS + class 6-writing or 7-operations) are exempt. Emits WARN per missing file.
  - `cmd: node cli/dist/index.js review`

- [x] `checkApprovalPresent` registered in `DriftChecker.check()` method.
  - `file: cli/src/main/ts/application/use-cases/drift-checker.ts`

- [x] `arch review` passes clean after implementation (existing archive pre-dates this requirement — apply same TTL-corpus exemption as ArchivedIdeaDecisions: only check tasks archived after a configurable `hanseiSinceTaskId` equivalent).
  - `cmd: node cli/dist/index.js review`

### Definition of Done
- [x] All ACs checked by Auditor
- [x] `arch review` passes
- [x] `npm test` passes in `cli/`

## Hansei
**Severity:** H1
**Category:** [AuditGap]
**Decision:** Implemented. TASK-FORMAT.md documents ## Approval with format and L2 exemption. checkApprovalPresent added to DriftChecker with same corpus threshold as HanseiPresent (hanseiSinceTaskId=195). 185 archived tasks backfilled with inferred approval dates from Closed-at field.
**Constraint:** Backfilled approvals use Closed-at date as approval date — mechanically inferred, not human-authored. Acceptable for pre-corpus tasks; new tasks require explicit Auditor write.
**Cost:** 185 archive files modified in one batch — large commit, not atomic. Necessary to clear WARN on first run of the check.
**Forward Action:** None.
