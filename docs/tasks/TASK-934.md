## TASK-934: Implement tiered Hansei and Approval obligations
**Meta:** P1 | S | READY | Focus:no | 2-code-generation | claude | cli/src/main/ts/application/use-cases/drift-checker.ts, cli/src/main/ts/domain/services/task-validator.ts, docs/TASK-FORMAT.md, docs/AGENTS.md

### Context

Promoted from IDEA-tiered-obligations (human decision 2026-05-18, v1.0.0 readiness plan).

The blanket "all tasks TASK-195+ require Hansei" rule is the structural root cause of `TaskTemplateCompliance` drift. XS and S tasks accumulate Hansei debt faster than it can be cleared because every new task requires a Hansei stub at creation time. The human decision establishes a size-proportional tier model.

**Tier model (decided):**
- **XS/S Hansei:** Not required unless a trigger is met (blocker encountered, size miss, constitutional anomaly). If no trigger → no Hansei required at close.
- **M/L/XL Hansei:** Mandatory structured Hansei on every close.
- **Approval:** Follows L3 gate logic (ADR-009). XS/S tasks exempt. M/L tasks require explicit `## Approval`.

**Three change sites:**

1. `drift-checker.ts:checkTaskTemplateCompliance` — currently flags all open TASK-195+ tasks missing Hansei. Fix: only flag M/L/XL tasks.
2. `drift-checker.ts:checkApprovalPresent` — currently exempts only XS + 6-writing/7-operations. Fix: exempt XS and S regardless of class.
3. `task-validator.ts:validateHansei` — currently requires Hansei for `isMPlus || isClosing`. Fix: require Hansei only for M+ tasks at close; XS/S optional (still validated if present).

**Measurement target:** `TaskTemplateCompliance` warning count drops from 15 to near-zero after this fix (the remaining 15 warnings are all XS/S tasks).

### Acceptance Criteria

- [ ] `checkTaskTemplateCompliance` does not flag XS or S open tasks for missing `## Hansei`.
  - `cmd: arch review` — no XS/S task lines under TaskTemplateCompliance Hansei warnings
- [ ] `checkTaskTemplateCompliance` still flags M/L/XL open tasks missing `## Hansei` stubs.
  - `code: drift-checker.ts` — size gate present in Hansei check
- [ ] `checkApprovalPresent` does not flag XS or S archived tasks for missing `## Approval`.
  - `cmd: arch review` — no XS/S task lines under ApprovalPresent
- [ ] `checkApprovalPresent` still flags M/L archived tasks missing `## Approval`.
  - `code: drift-checker.ts` — size gate present in ApprovalPresent check
- [ ] `task-validator.ts:validateHansei` does not produce an error for XS/S tasks at REVIEW/DONE when no Hansei is present.
  - `code: task-validator.ts` — isClosing condition removed or gated on size
- [ ] If a Hansei section IS present on an XS/S task, it is still validated for correctness (severity, category, field length).
  - `code: task-validator.ts` — validation runs when hansei is present, regardless of size
- [ ] `TaskTemplateCompliance` warning count drops after this fix.
  - `cmd: arch review` — fewer Hansei warnings than the 15 currently present
- [ ] `docs/TASK-FORMAT.md` obligation table reflects the tier model (XS/S conditional, M/L/XL mandatory).
- [ ] `docs/AGENTS.md` archiving requirements section reflects the tier model.

### Definition of Done
- [ ] Tests pass (TDD: failing tests written before implementation for each changed check).
- [ ] `arch review` passes (no new violations).
- [ ] `arch report` passes.

## Hansei

**Severity:** H1
**Category:** [SpecDrift]
**Decision:** Placeholder — to be filled at close.
**Constraint:** Placeholder — to be filled at close.
**Cost:** Placeholder — to be filled at close.
**Forward Action:** Placeholder — to be filled at close.
