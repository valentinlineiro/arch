## TASK-106: Support batch task references in commit messages
**Meta:** P2 | XS | 5 | READY | Focus:no | 7-operations | local | cli/src/main/ts/domain/services/reviewer.ts

### Acceptance Criteria
- [ ] `Reviewer.validateCommitMessage` allows multiple `[TASK-XXX]` references in a single commit message.
- [ ] Supported formats include space-separated (`[TASK-001] [TASK-002]`) and comma-separated (`[TASK-001], [TASK-002]`).
- [ ] At least one `[TASK-XXX]` (or `task:`/`idea:` prefix) is still required.
- [ ] New tests in `reviewer.test.ts` verify multi-task support.
- [ ] `arch review` passes.

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
