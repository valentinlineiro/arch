## TASK-061: Remove unsafe pull and merge behavior from protocol
**Meta:** P0 | S | READY | Focus:yes | 7-operations | local | docs/agents/DO.md, docs/guidelines/core.md, docs/guidelines/autonomy.md, docs/guidelines/what-ai-must-never-do-in-this-repo.md

### Bug
ARCH currently contains protocol instructions that can trigger git operations the agent should not perform by default:

- `docs/agents/DO.md` mandates `git pull` as the first execution step.
- `docs/guidelines/core.md` says no agent merges its own PR, except Level 3 Autonomy.
- `docs/guidelines/autonomy.md` authorizes auto-merge at Level 3 for some categories.
- `docs/guidelines/what-ai-must-never-do-in-this-repo.md` says simply: `Merge PRs`.

This creates two risks:
1. `git pull` can introduce unexpected merges/rebases into an active worktree.
2. Merge authority is contradictory across protocol sources, so an agent can justify behavior that other rules forbid.

### Root Cause
Older git-operational assumptions survived while autonomy rules evolved independently. The protocol no longer has a single, explicit safety contract for pull/merge behavior.

### Fix
Define one canonical git-safety policy and align the protocol to it:

- Remove or narrow automatic `git pull` from DO mode.
- State exactly when `fetch`, `pull`, `rebase`, or `merge` are allowed.
- Reconcile merge authority across `core.md`, `autonomy.md`, and `what-ai-must-never-do-in-this-repo.md`.
- Ensure the default agent path cannot perform merge-producing git operations without explicit human approval.

### Acceptance Criteria
- [ ] `docs/agents/DO.md` no longer instructs unconditional `git pull`
- [ ] Merge authority rules are consistent across all guideline files
- [ ] Protocol clearly distinguishes safe read-only sync (`git fetch`) from history-changing sync (`pull`, `merge`, `rebase`)
- [ ] `arch review` or equivalent check can detect future drift in git-safety rules

### Definition of Done
- [ ] Canonical policy documented in one source of truth and referenced elsewhere
- [ ] No remaining contradictory pull/merge guidance in active protocol docs
- [ ] PR approved
