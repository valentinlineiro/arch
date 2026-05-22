## TASK-993: Add ARCH git hooks (commit-msg, pre-commit, pre-push)
**Meta:** P1 | M | READY | Focus:no | 7-operations | local | docs/guidelines/core.md, cli/src/main/ts
**Source:** IDEA-productizing-arch-separation Phase B

### Acceptance Criteria
- [ ] `commit-msg` hook auto-appends TASK-ID reference to commit messages if missing → cmd: test -f .githooks/commit-msg; exit: 0
- [ ] `pre-commit` hook runs `arch check --scope delta` on staged changes → cmd: grep "arch check --scope delta" .githooks/pre-commit; exit: 0
- [ ] `pre-push` hook rejects pushes with `REVIEW`-status tasks in `docs/tasks/` → cmd: grep "arch check" .githooks/pre-push; exit: 0
- [ ] Hooks are auto-installed by `arch init` (non-destructive — skip if hooks dir exists) → grep: "githooks" cli/src/main/ts/commands/init.ts
- [ ] `arch check` passes → cmd: arch check; exit: 0
- [ ] Documentation: `docs/guidelines/core.md` references the hook install path

### Definition of Done
- [ ] All three hooks functional and version-controlled
- [ ] `arch check` passes

## Hansei
<!-- Placeholder — to be filled at close per ADR-019 -->
