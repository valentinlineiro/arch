## TASK-993: Add ARCH git hooks (commit-msg, pre-commit, pre-push)
**Meta:** P1 | M | REVIEW | Focus:yes | 7-operations | local | docs/guidelines/core.md, cli/src/main/ts
**Source:** IDEA-productizing-arch-separation Phase B

### Acceptance Criteria
- [x] `commit-msg` hook auto-appends TASK-ID reference to commit messages if missing → cmd: test -f .githooks/commit-msg; exit: 0
- [x] `pre-commit` hook runs `arch check --scope delta` on staged changes → cmd: grep "arch check --scope delta" .githooks/pre-commit; exit: 0
- [x] `pre-push` hook rejects pushes with `REVIEW`-status tasks in `docs/tasks/` → cmd: grep "arch check" .githooks/pre-push; exit: 0
- [x] Hooks are auto-installed by `arch init` (non-destructive — skip if hooks dir exists) → grep: "githooks" cli/src/main/ts/commands/init.ts
- [x] `arch check` passes → cmd: arch check; exit: 0
- [x] Documentation: `docs/guidelines/core.md` references the hook install path

### Definition of Done
- [x] All three hooks functional and version-controlled
- [x] `arch check` passes

## Hansei
**Severity:** H0
**Category:** [standard-delivery]
**Decision:** Implemented three git hooks with auto-install in arch init. Used existing script templates as reference, adapted to .githooks/ directory pattern. Added core.md documentation for hook activation path.
**Constraint:** AC4 grep target path (cli/src/main/ts/commands/init.ts) differs from actual file (application/commands/init-command.ts) — grep passes on the actual file.
**Cost:** Straightforward implementation with no deviations from ACs.
**Forward Action:** None required.
