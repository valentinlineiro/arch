## TASK-894: Add ApprovalPresent drift check to arch review
**Meta:** P2 | S | IN_PROGRESS | Focus:yes | 1-code-reasoning | claude-code | cli/src/main/ts/application/use-cases/drift-checker.ts, docs/TASK-FORMAT.md

**Depends:** none

### Context

DONE tasks require human approval before archival (per DO.md), but there is no structured approval artifact in the task file. Approval exists only in conversation or commit messages, making it unverifiable by `arch review`. The Auditor role is the canonical approver — the `## Hansei` section closing flow already validates Hansei; this task adds equivalent validation for the approval act itself.

**Decision on format:** The Auditor writes the approval. For tasks closed by Auditor session (human-reviewed), the format is `Approved-by: Auditor | <ISO-date>`. For tasks promoted autonomously via L2 (XS 6-writing/7-operations), the approval is implicit in the autonomous promotion log — those tasks are exempt from the `ApprovalPresent` check.

### Acceptance Criteria

- [ ] `docs/TASK-FORMAT.md` documents the `## Approval` section with required format: `Approved-by: Auditor | <ISO-date>`. L2 autonomous tasks are noted as exempt.
  - `file: docs/TASK-FORMAT.md`

- [ ] `DriftChecker.checkApprovalPresent()` added: scans `docs/archive/TASK-*.md` for DONE tasks missing a valid `## Approval` section. L2 autonomous tasks (size XS + class 6-writing or 7-operations) are exempt. Emits WARN per missing file.
  - `cmd: node cli/dist/index.js review`

- [ ] `checkApprovalPresent` registered in `DriftChecker.check()` method.
  - `file: cli/src/main/ts/application/use-cases/drift-checker.ts`

- [ ] `arch review` passes clean after implementation (existing archive pre-dates this requirement — apply same TTL-corpus exemption as ArchivedIdeaDecisions: only check tasks archived after a configurable `hanseiSinceTaskId` equivalent).
  - `cmd: node cli/dist/index.js review`

### Definition of Done
- [ ] All ACs checked by Auditor
- [ ] `arch review` passes
- [ ] `npm test` passes in `cli/`

## Hansei
**Severity:** H0
**Category:** [no-issue]
**Decision:** Not yet started.
**Constraint:** None.
**Cost:** None.
**Forward Action:** None.
