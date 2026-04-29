## TASK-124: Auto-create bypasses safeguards and leaves partial state
**Meta:** P1 | XS | 8 | READY | Focus:no | 7-operations | local | cli/src/main/ts/application/commands/review-command.ts, docs/agents/DO.md

## Problem
Review-command saves task first, then attempts git add && commit, and merely logs failure. DO.md:17 requires duplicate search and halting before new task creation. DO.md:22 says registration is incomplete until commit succeeds.

## Impact
Partial state on failure — task exists but isn't registered, violating protocol integrity.

## Acceptance Criteria
- [ ] On commit failure, rollback task file creation
- [ ] Atomic operation: task file and git commit both succeed or both fail
- [ ] Error reported clearly, not just logged
