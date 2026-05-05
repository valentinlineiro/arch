## TASK-189: Add executable AC predicates to task format and DO close step
**Meta:** P0 | M | IN_PROGRESS | Focus:yes | 2-code-generation | claude-code | docs/TASK-FORMAT.md, docs/agents/DO.md, cli/src/main/ts/
**Depends:** none

### Context
ACs are prose assessed by the executor — a conflict of interest at any autonomy level. Executable predicates allow deterministic, third-party-reproducible verification. This is the prerequisite for trusting autonomous task close without an Auditor for every task.

### Acceptance Criteria
- [ ] `TASK-FORMAT.md` documents optional `cmd:` predicate syntax appended to AC items: `- [ ] Description →  cmd: <command>; exit: <code>`
- [ ] `DO.md` close step specifies: before setting status to REVIEW, run all `cmd:` predicates; a failing predicate blocks the status transition
- [ ] `arch validate --acs TASK-XXX` command runs all `cmd:` predicates for a task and reports pass/fail per AC
- [ ] A task with one or more failing `cmd:` predicates cannot be transitioned to REVIEW (enforced by the CLI)
- [ ] `arch review` passes
- [ ] `npm test` passes in `cli/`

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
- [ ] `npm test` passes in `cli/`.
