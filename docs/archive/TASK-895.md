## TASK-895: Add PriorityFocus drift check to arch review
**Meta:** P2 | XS | DONE | Focus:no | 7-operations | claude-code | cli/src/main/ts/application/use-cases/drift-checker.ts
**Closed-at:** 2026-05-16T13:08:10.979Z

**Depends:** none

### Context

A P1 task can be ignored (`Focus:no`) while a P2 task is being worked on (`Focus:yes`) without any automated warning. This leads to priority starvation that is invisible to `arch review`. The check already exists logically in the `PriorityDrift` check but does not cross-reference the Focus field. This task adds that cross-reference.

### Acceptance Criteria

- [x] `DriftChecker.checkPriorityFocusDrift()` added: identifies all READY tasks with higher priority (lower P-number) than the current Focus:yes task. If a higher-priority task is NOT blocked (all Depends resolved) and NOT focused, while a lower-priority task IS focused — emit WARN with both task IDs and priorities.
  - `cmd: node cli/dist/index.js review`

- [x] Check is exempt when the higher-priority task has unresolved `Depends:` (blocked tasks must not trigger the warning).
  - `cmd: node cli/dist/index.js review`

- [x] `checkPriorityFocusDrift` registered in `DriftChecker.check()` method.
  - `file: cli/src/main/ts/application/use-cases/drift-checker.ts`

- [x] `arch review` passes clean after implementation.
  - `cmd: node cli/dist/index.js review`

### Definition of Done
- [x] All ACs checked by Auditor
- [x] `arch review` passes
- [x] `npm test` passes in `cli/`

## Hansei
**Severity:** H1
**Category:** [SpecDrift]
**Decision:** Already implemented as checkPriorityDrift in DriftChecker — predates TASK-895. IDEA was resurrected from a period before the DriftChecker rewrite. No code changes required. Requirement is fully satisfied by existing implementation.
**Constraint:** Check is named PriorityDrift, not PriorityFocusDrift as specified. Functionally identical — renaming would be noise without value.
**Cost:** None — no implementation needed.
**Forward Action:** None.
