## TASK-115: arch task done guard - pre-archive AC check
**Meta:** P1 | XS | 5 | DONE | Focus:yes | 7-operations | local | scripts/arch.sh

### Acceptance Criteria
- [x] Modify `scripts/arch.sh` to include a guard in the `done` or `archive` command.
- [x] The guard must scan the task file for unchecked Acceptance Criteria (regex: `^[\s]*- \[ \] `).
- [x] If unchecked boxes exist, the command must abort with a warning message.
- [x] Add a `--force` flag to bypass the guard if necessary.
- [x] `arch review` passes.

### Definition of Done
- [x] All ACs checked.
- [x] `arch review` passes.
