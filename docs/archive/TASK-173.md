## TASK-173: [BUG] Missing pre-push guard for No-Merge policy
**Meta:** P0 | XS | DONE | Focus:no | 7-operations | local | scripts/git-hooks/, scripts/install-hooks.sh
**Closed-at:** 2026-05-04T13:02:48.931Z
**Depends:** none

### Acceptance Criteria
- [x] Create `scripts/git-hooks/pre-push.template` that executes `./scripts/arch.sh review`.
- [x] Update `scripts/install-hooks.sh` to install the `pre-push` hook.
- [x] Verify that a simulated merge commit blocks the push (local verification).

### Context
#### Problem
While `arch review` now correctly detects merge commits in the lookback window, it only runs on-demand or during THINK/DO cycles. Implicit merges can still be committed and pushed if the developer forgets to run the review manually.

#### Solution
Automate the check via a `pre-push` git hook to guarantee that no branch with merge violations ever reaches the remote.

### Definition of Done
- [x] `pre-push` hook is present in `.git/hooks/`.
- [x] `arch review` passes.
