## BUG: Auto-create bypasses safeguards and leaves partial state
**Author:** review | **Status:** OPEN | **Focus:** yes

### Problem
Review-command saves task first, then attempts git add && commit, and merely logs failure. DO.md:17 requires duplicate search and halting before new task creation. DO.md:22 says registration is incomplete until commit succeeds.

### Evidence
- review-command.ts:79: logs failure but doesn't rollback the saved task file
- DO.md:17,22: safeguards not applied to auto-create path
- TASK-117 left uncommitted in worktree after commit failure

### Impact
Partial state on failure - task exists but isn't registered, violating protocol integrity.

### Priority
Medium