## TASK-934: Implement tiered Hansei and Approval obligations
**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | claude | cli/src/main/ts/application/use-cases/drift-checker.ts, cli/src/main/ts/domain/services/task-validator.ts, docs/TASK-FORMAT.md, docs/AGENTS.md | Closed-at: 2026-05-18T17:00:00Z

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

- [x] `checkTaskTemplateCompliance` does not flag XS or S open tasks for missing `## Hansei`.
  - `cmd: arch review` — no XS/S task lines under TaskTemplateCompliance Hansei warnings
- [x] `checkTaskTemplateCompliance` still flags M/L/XL open tasks missing `## Hansei` stubs.
  - `code: drift-checker.ts` — size gate present in Hansei check
- [x] `checkApprovalPresent` does not flag XS or S archived tasks for missing `## Approval`.
  - `cmd: arch review` — no XS/S task lines under ApprovalPresent
- [x] `checkApprovalPresent` still flags M/L archived tasks missing `## Approval` (TASK-255, 257, 927 — all M).
  - `code: drift-checker.ts` — size gate present in ApprovalPresent check
- [x] `task-validator.ts:validateHansei` does not produce an error for XS/S tasks at REVIEW/DONE when no Hansei is present.
  - `code: task-validator.ts` — isClosing condition removed; only isMPlus gates Hansei requirement
- [x] If a Hansei section IS present on an XS/S task, it is still validated for correctness (severity, category, field length).
  - `code: task-validator.ts` — validation block runs whenever hansei is non-null, regardless of size
- [x] `TaskTemplateCompliance` warning count drops: 15 → 0.
  - `cmd: arch review` — TaskTemplateCompliance: ✔
- [x] `docs/TASK-FORMAT.md` obligation table and Hansei section reflect the tier model.
- [x] `docs/AGENTS.md` archiving requirements section reflects the tier model (Hansei + Approval both tiered).

### Definition of Done
- [x] Tests pass: 8 TASK-934 tests RED→GREEN; pre-existing S-in-REVIEW test updated to match new spec; no regressions.
- [x] `arch review`: TaskTemplateCompliance clean; ApprovalPresent 9→3 (all remaining are M tasks).
- [x] `arch report` passes.

## Hansei

**Severity:** H1
**Category:** [SpecDrift]
**Decision:** Implemented size-proportional Hansei and Approval obligations. Three change sites: checkTaskTemplateCompliance (size gate added), checkApprovalPresent (XS/S exempt regardless of class), validateHansei (isClosing removed; only isMPlus triggers requirement). TaskTemplateCompliance: 15 → 0. ApprovalPresent: 9 → 3 (all remaining are M tasks, correctly flagged).
**Constraint:** ApprovalPresent still has 3 M-task violations (TASK-255, 257, 927). These require explicit human Approval sections added to archived tasks — separate from this task's scope.
**Cost:** One pre-existing test (`validateHansei - missing Hansei for S task in REVIEW`) encoded the old rule and was updated to reflect the decided tier model.
**Forward Action:** Next step: ApprovalPresent cleanup for TASK-255, 257, 927 (add ## Approval sections). Then Metrics Narrowing.
