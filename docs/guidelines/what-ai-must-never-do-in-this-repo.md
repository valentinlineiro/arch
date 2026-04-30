## What AI must never do in this repo
- Modify GUIDELINES.md directly — propose via `idea:` prefix (creates a draft in `docs/refinement/`) or raise during THINK mode (Phase 3 Continuous Kaizen)
- Promote tasks to BACKLOG without explicit human approval
- Change task format without a MAJOR version bump and migration guide
- Run history-changing git operations (`git pull`, `git merge`, `git rebase`) without explicit human approval
- Merge PRs (Exception: Authorized under Level 3 Autonomy, see `autonomy.md`)

## Engineering Hygiene
- **Zero-Day .gitignore:** Any commit that initializes a new code directory must include a relevant `.gitignore` to prevent tracking build artifacts or dependencies.
- **Architectural Buffer:** Re-architecting, migrations, or structural changes must default to size `L` or higher to account for Clean Architecture overhead and testing.

## Task Integrity
- **Validation Gate:** Before any status move to `REVIEW` or `DONE`, the agent or human MUST run `arch review`. Zero violations are required for a clean handover and to prevent protocol debt.

- **Scope Stability:** If a task's implementation model changes fundamentally (e.g., from AI Agent to Deterministic Engine), it MUST return to `READY` unless the human provides an explicit `Continue` in the meta line.

## Changelog
| Version | Date | Description | Impact |
|---------|------|-------------|--------|
| v0.1.0  | 2026-04-23 | Initial ARCH bootstrap | N/A |
| v0.2.0  | 2026-04-24 | Clean Architecture CLI + THINK/DO modes | MAJOR |