## TASK-189: Add executable AC predicates to task format and DO close step
**Meta:** P0 | M | IN_PROGRESS | Focus:yes | 2-code-generation | claude-code | docs/TASK-FORMAT.md, docs/agents/DO.md, cli/src/main/ts/
**Depends:** none

### Context
ACs are prose assessed by the executor — a conflict of interest at any autonomy level. Executable predicates allow deterministic, third-party-reproducible verification. This is the prerequisite for trusting autonomous task close without an Auditor for every task.

### Acceptance Criteria
- [x] `TASK-FORMAT.md` documents optional `cmd:` predicate syntax appended to AC items: `- [x] Description →  cmd: <command>; exit: <code>`
- [x] `DO.md` close step specifies: before setting status to REVIEW, run all `cmd:` predicates; a failing predicate blocks the status transition
- [x] `arch validate --acs TASK-XXX` command runs all `cmd:` predicates for a task and reports pass/fail per AC
- [x] A task with one or more failing `cmd:` predicates cannot be transitioned to REVIEW (enforced by the CLI)
- [x] `arch review` passes
- [x] `npm test` passes in `cli/`

### Definition of Done
- [x] All ACs checked.
- [x] `arch review` passes.
- [x] `npm test` passes in `cli/`.

## Hansei
The `arch task review` predicate enforcement only runs when the agent explicitly calls the command — a human or agent editing the Meta line directly can still bypass it. A pre-commit hook checking pending `cmd:` predicates would close this gap without requiring discipline from the caller.
