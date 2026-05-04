## TASK-167: Implement 'arch lint' and pre-commit hook for Meta format
**Meta:** P1 | S | READY | Focus:no | 7-operations | local | cli/src/main/ts/application/commands/lint-command.ts, scripts/install-hooks.sh, .git/hooks/pre-commit
**Depends:** none

### Acceptance Criteria
- [ ] Implement `arch lint` command that validates Meta line format for all tasks in `docs/tasks/`.
- [ ] Add `arch lint` check to `scripts/install-hooks.sh` as a pre-commit hook.
- [ ] Pre-commit hook should only lint staged `.md` files in `docs/tasks/`.
- [ ] Linter should exit with non-zero code on failure.

### Definition of Done
- [ ] `arch lint` correctly identifies FormatViolation.
- [ ] Pre-commit hook prevents committing invalid task files.
- [ ] `arch review` passes.
