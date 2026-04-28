## TASK-109: Fix CLI dependency parsing and validation
**Meta:** P1 | XS | READY | Focus:yes | 2-code-generation | claude | cli/src/main/ts/infrastructure/filesystem/markdown-task-repository.ts, cli/src/main/ts/domain/services/task-validator.ts

### Acceptance Criteria
- [ ] `MarkdownTaskRepository.parseTask` correctly parses the `**Depends:**` line into the `Task.depends` field.
- [ ] `TaskValidator` includes a check for the `**Depends:**` line format.
- [ ] `SelectNextTask` uses the parsed dependencies to correctly filter blocked tasks (verified by `arch next` not suggesting TASK-088 while TASK-086 is IN_PROGRESS).
- [ ] `arch review` passes on the updated codebase.

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
