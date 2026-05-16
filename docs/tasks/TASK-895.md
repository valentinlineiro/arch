## TASK-895: Add PriorityFocus drift check to arch review
**Meta:** P2 | XS | IN_PROGRESS | Focus:yes | 7-operations | claude-code | cli/src/main/ts/application/use-cases/drift-checker.ts

**Depends:** none

### Context

A P1 task can be ignored (`Focus:no`) while a P2 task is being worked on (`Focus:yes`) without any automated warning. This leads to priority starvation that is invisible to `arch review`. The check already exists logically in the `PriorityDrift` check but does not cross-reference the Focus field. This task adds that cross-reference.

### Acceptance Criteria

- [ ] `DriftChecker.checkPriorityFocusDrift()` added: identifies all READY tasks with higher priority (lower P-number) than the current Focus:yes task. If a higher-priority task is NOT blocked (all Depends resolved) and NOT focused, while a lower-priority task IS focused — emit WARN with both task IDs and priorities.
  - `cmd: node cli/dist/index.js review`

- [ ] Check is exempt when the higher-priority task has unresolved `Depends:` (blocked tasks must not trigger the warning).
  - `cmd: node cli/dist/index.js review`

- [ ] `checkPriorityFocusDrift` registered in `DriftChecker.check()` method.
  - `file: cli/src/main/ts/application/use-cases/drift-checker.ts`

- [ ] `arch review` passes clean after implementation.
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
