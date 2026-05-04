## TASK-169: [BUG] Unauthorized merge commits in git history
**Meta:** P0 | S | DONE | Focus:yes | 7-operations | local | scripts/arch.sh, cli/src/main/ts/domain/services/drift-checker.ts
**Depends:** none

### Acceptance Criteria
- [x] Add a `MergeCommitCheck` to `arch review` (DriftChecker) that fails if any merge commit (2+ parents) is found in the last 20 commits.
- [x] Update `scripts/arch.sh` to ensure `git push` or any git operation never triggers an implicit merge.
- [x] Document the "No Merge" policy in `docs/guidelines/core.md`.
- [x] Investigate and suppress the `setlocale` warning in `SubprocessRunner` or shell environment.

### Context
User reported "Merges still happening" with a log timestamp `2026-05-04 09:02:50.510`.
Git history shows `3d7ed00` and `6adda61` as merge commits, which is a protocol violation.

### Definition of Done
- [x] `arch review` correctly identifies merge commits.
- [x] No new merge commits created during autonomous operations.
- [x] arch review passes.
