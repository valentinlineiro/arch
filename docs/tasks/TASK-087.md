## TASK-087: Auto-create P0 bug task on arch review failure
**Meta:** P1 | S | READY | Focus:no | 2-code-generation | claude | cli/src/main/ts/application/commands/review-command.ts, cli/src/main/ts/application/use-cases/

### Acceptance Criteria
- [ ] `ReviewCommand` exposes a `next-task-id` utility (scanning `docs/tasks/` + `docs/archive/` for highest TASK-XXX and incrementing).
- [ ] When `arch review` detects violations, it creates `docs/tasks/TASK-XXX.md` with P0 | XS | READY | Focus:yes and one AC checkbox per violation line.
- [ ] The task file is written and committed atomically before `review` exits non-zero.
- [ ] If a `Fix arch review violations` task already exists in READY or IN_PROGRESS state, creation is skipped and the existing ID is printed.
- [ ] When `arch review` passes, no task is created.
- [ ] `arch review` passes on the updated codebase.

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
