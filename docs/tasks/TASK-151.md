## TASK-151: Add commit-msg hook enforcing TASK-ID in commit messages
**Meta:** P2 | S | READY | Focus:no | 7-operations | local | cli/src/, docs/guidelines/core.md, DEVELOPMENT.md
**Sprint:** sprint/v0.7-foundations

### Acceptance Criteria
- [ ] Create `scripts/install-hooks.sh` that installs a `commit-msg` hook into `.git/hooks/`.
- [ ] The hook validates that commit messages contain `[TASK-XXX]`, or match an exempted prefix: `idea:`, `chore: open sprint/`, `chore: close sprint/`, or include `[THINK]`.
- [ ] On violation, the hook prints a clear error message referencing `docs/guidelines/core.md` and exits non-zero.
- [ ] Document the installation step in `DEVELOPMENT.md`.
- [ ] `arch review` passes.

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
