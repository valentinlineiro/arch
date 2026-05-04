## TASK-167: Implement 'arch lint' and pre-commit hook for Meta format
**Meta:** P1 | S | DONE | Focus:no | 7-operations | local | scripts/install-hooks.sh
**Closed-at:** 2026-05-04T12:17:32.807Z
**Depends:** none

### Acceptance Criteria
- [x] Implement `arch lint` command that validates Meta line format for all tasks in `docs/tasks/`.
- [x] Add `arch lint` check to `scripts/install-hooks.sh` as a pre-commit hook.
- [x] Pre-commit hook should only lint staged `.md` files in `docs/tasks/`.
- [x] Linter should exit with non-zero code on failure.

### Definition of Done
- [x] `arch lint` correctly identifies FormatViolation.
- [x] Pre-commit hook prevents committing invalid task files.
- [x] `arch review` passes.
