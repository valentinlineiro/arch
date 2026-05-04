# INBOX
<!-- Weekly dashboard for human-agent coordination -->
<!-- Generated on: 2026-05-04 -->

## Status Summary
- **Active Tasks:** 3
- **In Review:** 1
- **Backlog (Ready):** 15

## Urgent / Actions Required
- [ ] [TASK-187] [BUG] INBOX.md coordination surface shows stale active tasks (P1) - Active in Focus

## Refinement Queue
_No pending ideas._

## Current Sprint
_No active sprint._

## Recent Activity
- **Last Commit:** fix: [TASK-187] register bug — stale INBOX.md coordination surface

## [2026-05-04 00:00] REVIEW_REQUEST | TASK-174
**Task:** Fix loop mode performance - eliminate subprocess cold starts
**ACs:**
- [x] LoopEngine calls GovernSystem.execute(true) directly
- [x] LoopEngine calls ReviewSystem directly
- [x] LoopEngine handles archive/done via MarkTaskDone directly
- [x] arch exec remains the only subprocess call
- [x] Double-govern per cycle eliminated
- [x] --dry-run and --resume still work
**Changed files:**
- cli/src/main/ts/application/use-cases/loop-engine.ts
- cli/src/main/ts/application/commands/loop-command.ts
- cli/src/main/ts/index.ts

## [2026-05-04 00:00] REVIEW_REQUEST | TASK-175
**Task:** Migrate arch.sh routing logic to TypeScript
**ACs:**
- [x] invoke_agent routing moved into ExecCommand using ConfigLoader
- [x] local routing mode preserved
- [x] CLI fallback order + which checks covered by 11 unit tests
- [x] Post-task-done govern removed from arch.sh
- [x] arch.sh reduced to thin dispatcher
- [x] CHANGELOG entry added
**Changed files:**
- cli/src/main/ts/application/commands/exec-command.ts (new)
- cli/src/test/ts/exec-command.test.ts (new, 11 tests)
- cli/src/main/ts/index.ts
- scripts/arch.sh
- CHANGELOG.md
