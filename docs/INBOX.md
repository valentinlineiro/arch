# INBOX
<!-- Weekly dashboard for human-agent coordination -->
<!-- Generated on: 2026-05-04 -->

## Status Summary
- **Active Tasks:** 2
- **In Review:** 2
- **Backlog (Ready):** 15

## Urgent / Actions Required
- [ ] [TASK-187] [BUG] INBOX.md coordination surface shows stale active tasks (P1) - In Review

## Refinement Queue
_No pending ideas._

## Current Sprint
_No active sprint._

## Recent Activity
- **Last Commit:** fix: [TASK-187] fix stale INBOX.md coordination surface

## [2026-05-05 00:00] REVIEW_REQUEST | TASK-159
**Task:** Define and Implement Metrics Schema for METRICS.md
**ACs:**
- [x] JSON schema defined (Schema section added to METRICS.md with field table)
- [x] Includes cycle time (P50/P90), cost per task, REVIEW_FAIL rate, and token usage trends
- [x] Format is machine-readable (```json block tagged machine-readable-block)
**Changed files:**
- docs/METRICS.md
- docs/tasks/TASK-159.md

## [2026-05-04 00:00] REVIEW_REQUEST | TASK-187
**Task:** [BUG] INBOX.md coordination surface shows stale active tasks
**ACs:**
- [x] INBOX.md "Urgent / Actions Required" no longer references TASK-172 or TASK-173
- [x] INBOX.md Status Summary counts match actual task state
- [x] `arch review` passes
**Changed files:**
- docs/INBOX.md
- docs/tasks/TASK-187.md

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
