## TASK-088: Autonomous loop - CI workflows with human-in-the-loop gates
**Meta:** P1 | M | READY | Focus:no | 7-operations | local | .github/workflows/, scripts/arch.sh, docs/agents/
**Depends:** TASK-086

### Acceptance Criteria
- [ ] `.github/workflows/conduct.yml` runs `arch conduct` on schedule (daily) and on push to main; THINK output is posted as a PR body if any files changed.
- [ ] `.github/workflows/review.yml` triggers `arch review` on every PR merge; failure opens a PR body report.
- [ ] `.github/workflows/exec.yml` is a `workflow_dispatch` job that runs `arch exec` on the focused task; output is posted as a PR body.
- [ ] Auth for AI CLIs is handled via repository secrets (`ANTHROPIC_API_KEY`, `GEMINI_API_KEY`).
- [ ] THINK workflow uses read-only tool scope (`--tools "Read,Bash(git *)"`) to avoid unsafe writes in CI.
- [ ] Existing L2 autonomy rules (only XS ops/writing IDEAs auto-promoted) are enforced in CI identically to local.
- [ ] Standard action safety boundary matrix is documented in `docs/agents/DO.md`: `action:test`, `action:lint`, `action:build` execute automatically; `action:deploy`, `action:pr-create` require human gate.
- [ ] Each standard action is implemented as a reusable GitHub Actions workflow callable from `exec.yml`.
- [ ] `arch review` passes.

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
