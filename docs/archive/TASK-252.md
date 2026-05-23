## TASK-252: Introduce size-tiered closure and review obligations
**Meta:** P1 | M | DONE | Focus:no | 6-writing | claude | docs/TASK-FORMAT.md, docs/agents/DO.md, cli/src/main/ts/application/use-cases/mark-task-done.ts, cli/src/main/ts/domain/services/task-validator.ts
**Closed-at:** 2026-05-18T21:43:23.432Z

## Hansei
**Severity:** H0
**Category:** [SpecDrift]

**Decision:**
S blocker-sensitive Hansei rule deferred in v1. S Hansei is always optional regardless of whether blockers were encountered, because structured blocker history is not queryable at close time in the current implementation.

**Constraint:**
Making S Hansei conditional on blocker presence requires blocker events to be persisted as structured task data — infrastructure that does not exist in this task's scope and would increase the size beyond M.

**Cost:**
S tasks that encountered significant blockers may close without Hansei in v1. The gap is accepted on the grounds that S tasks are small enough that the debt surface is bounded.

**Forward Action:**
None required. S blocker-sensitive Hansei is explicitly deferred until structured blocker history is persisted.

## Approval
Approved-by: valentinlineiro | 2026-05-19
