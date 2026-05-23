## TASK-934: Implement tiered Hansei and Approval obligations
**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | claude | cli/src/main/ts/application/use-cases/drift-checker.ts, cli/src/main/ts/domain/services/task-validator.ts, docs/TASK-FORMAT.md, docs/AGENTS.md | Closed-at: 2026-05-18T17:00:00Z

## Hansei

**Severity:** H1
**Category:** [SpecDrift]
**Decision:** Implemented size-proportional Hansei and Approval obligations. Three change sites: checkTaskTemplateCompliance (size gate added), checkApprovalPresent (XS/S exempt regardless of class), validateHansei (isClosing removed; only isMPlus triggers requirement). TaskTemplateCompliance: 15 → 0. ApprovalPresent: 9 → 3 (all remaining are M tasks, correctly flagged).
**Constraint:** ApprovalPresent still has 3 M-task violations (TASK-255, 257, 927). These require explicit human Approval sections added to archived tasks — separate from this task's scope.
**Cost:** One pre-existing test (`validateHansei - missing Hansei for S task in REVIEW`) encoded the old rule and was updated to reflect the decided tier model.
**Forward Action:** Next step: ApprovalPresent cleanup for TASK-255, 257, 927 (add ## Approval sections). Then Metrics Narrowing.
