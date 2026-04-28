## TASK-087: Auto-create P0 bug task on arch review failure
**Meta:** P1 | S | 5 | DONE | Focus:yes | 2-code-generation | claude | cli/src/main/ts/application/commands/review-command.ts, cli/src/main/ts/application/use-cases/

### Acceptance Criteria
- [x] `ReviewCommand` exposes a `next-task-id` utility (scanning `docs/tasks/` + `docs/archive/` for highest TASK-XXX and incrementing).
- [x] When `arch review` detects violations, it creates `docs/tasks/TASK-XXX.md` with P0 | XS | READY | Focus:yes and one AC checkbox per violation line.
- [x] The task file is written and committed atomically before `review` exits non-zero.
- [x] If a `Fix arch review violations` task already exists in READY or IN_PROGRESS state, creation is skipped and the existing ID is printed.
- [x] When `arch review` passes, no task is created.
- [x] `arch review` passes on the updated codebase.

### Definition of Done
- [x] All ACs checked.
- [x] `arch review` passes.
