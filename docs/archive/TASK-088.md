## TASK-088: Autonomous loop - CI workflows with human-in-the-loop gates
**Meta:** P1 | M | 5 | DONE | Focus:yes | 7-operations | local | .github/workflows/, scripts/arch.sh, docs/agents/
**Depends:** TASK-086
**Closed-at:** 2026-04-28T11:00:17.425Z

### Acceptance Criteria
- [x] `.github/workflows/conduct.yml` runs `arch conduct` on schedule (daily) and on push to main; THINK output is posted as a PR body if any files changed.
- [x] `.github/workflows/review.yml` triggers `arch review` on every PR merge; failure opens a PR body report.
- [x] `.github/workflows/exec.yml` is a `workflow_dispatch` job that runs `arch exec` on the focused task; output is posted as a PR body.
- [x] Auth for AI CLIs is handled via repository secrets (`ANTHROPIC_API_KEY`, `GEMINI_API_KEY`).
- [x] THINK workflow uses read-only tool scope (`--tools "Read,Bash(git *)"`) to avoid unsafe writes in CI.
- [x] Existing L2 autonomy rules (only XS ops/writing IDEAs auto-promoted) are enforced in CI identically to local.
- [x] Standard action safety boundary matrix is documented in `docs/agents/DO.md`: `action:test`, `action:lint`, `action:build` execute automatically; `action:deploy`, `action:pr-create` require human gate.
- [x] Each standard action is implemented as a reusable GitHub Actions workflow callable from `exec.yml`.
- [x] `arch review` passes.

### Definition of Done
- [x] All ACs checked.
- [x] `arch review` passes.
