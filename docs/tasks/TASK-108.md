## TASK-108: Dynamic Backlog Reprioritization with Value field
**Meta:** P1 | M | READY | Focus:yes | 7-operations | local | docs/tasks/, cli/src/, docs/agents/THINK.md

### Acceptance Criteria
- [ ] Update `TASK-FORMAT.md` and `TaskValidator` to include a mandatory `Value: [1-10]` field in the Meta line (v0.5 schema).
- [ ] Update `MarkdownTaskRepository` and `Task` model to support the new `Value` field.
- [ ] Implement `arch rank` command to display READY tasks sorted by `Value / Size` ratio.
- [ ] Update `arch next` and `arch govern` to use `Value / Size` as the primary sorting metric within priority tiers.
- [ ] Update `THINK.md` Phase 1 to explicitly include a "Value Audit" where the agent proposes adjustments to task values based on current project state.
- [ ] Add a migration script or command to inject a default `Value: 5` to all existing tasks.
- [ ] `arch review` passes.

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
