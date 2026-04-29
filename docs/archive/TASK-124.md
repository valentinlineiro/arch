## TASK-124: Auto-create bypasses safeguards and leaves partial state
**Meta:** P1 | XS | 8 | DONE | Focus:no | 7-operations | local | cli/src/main/ts/application/use-cases/govern-system.ts
**Closed-at:** 2026-04-29T08:01:54Z

## Problem
Review-command saves task first, then attempts git add && commit, and merely logs failure. DO.md:17 requires duplicate search and halting before new task creation. DO.md:22 says registration is incomplete until commit succeeds.

## Impact
Partial state on failure — task exists but isn't registered, violating protocol integrity.

## Acceptance Criteria
- [x] On commit failure, rollback task file creation
- [x] Atomic operation: task file and git commit both succeed or both fail
- [x] Error reported clearly, not just logged
