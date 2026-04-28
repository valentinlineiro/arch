## TASK-106: Support batch task references in commit messages
**Meta:** P2 | XS | 5 | DONE | Focus:yes | 7-operations | local | cli/src/main/ts/domain/services/reviewer.ts

### Acceptance Criteria
- [x] `Reviewer.validateCommitMessage` allows multiple `[TASK-XXX]` references in a single commit message.
- [x] Supported formats include space-separated (`[TASK-001] [TASK-002]`) and comma-separated (`[TASK-001], [TASK-002]`).
- [x] At least one `[TASK-XXX]` (or `task:`/`idea:` prefix) is still required.
- [x] New tests in `reviewer.test.ts` verify multi-task support.
- [x] `arch review` passes.

### Definition of Done
- [x] All ACs checked.
- [x] `arch review` passes.
