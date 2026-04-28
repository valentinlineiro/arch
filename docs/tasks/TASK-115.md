## TASK-115: arch task done guard - pre-archive AC check
**Meta:** P1 | XS | 5 | READY | Focus:no | 7-operations | local | scripts/arch.sh

### Acceptance Criteria
- [ ] Modify `scripts/arch.sh` to include a guard in the `done` or `archive` command.
- [ ] The guard must scan the task file for unchecked Acceptance Criteria (regex: `^[\s]*- \[ \] `).
- [ ] If unchecked boxes exist, the command must abort with a warning message.
- [ ] Add a `--force` flag to bypass the guard if necessary.
- [ ] `arch review` passes.

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
