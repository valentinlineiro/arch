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

## [2026-05-05 00:00] REVIEW_PASS | TASK-188
All ACs verified. Review issues fixed: machine-enforceable Last-Revision trigger in KAIZEN-LOG.md, minimum data guard, full IDEA path spec, [REVISION] tag added to Output section. `arch review` OK. Archived.

## [2026-05-05 00:00] REVIEW_PASS | TASK-189
All ACs verified. Review issues fixed: status guard in MarkTaskReview, timeout detection with timedOut field, ValidateCommand routing through TaskRepository, and MarkTaskReview test suite (5 tests). `npm test` 82/82. Archived.

## [2026-05-05 00:00] REVIEW_REQUEST | TASK-189
**Task:** Add executable AC predicates to task format and DO close step
**ACs:**
- [x] `TASK-FORMAT.md` documents `cmd:` predicate syntax
- [x] `DO.md` close step mandates `arch task review` before REVIEW transition
- [x] `arch validate --acs TASK-XXX` runs predicates and reports pass/fail
- [x] Failing predicates block `arch task review` transition (CLI-enforced)
- [x] `arch review` passes
- [x] `npm test` passes (76/76)
**Changed files:**
- docs/TASK-FORMAT.md, docs/agents/DO.md
- cli/src/main/ts/application/use-cases/validate-task-acs.ts (new)
- cli/src/main/ts/application/use-cases/mark-task-review.ts (new)
- cli/src/main/ts/application/commands/validate-command.ts
- cli/src/main/ts/application/commands/task-command.ts
- cli/src/main/ts/index.ts
- cli/src/test/ts/validate-task-acs.test.ts (new)

## [2026-05-05 00:00] REVIEW_PASS | TASK-184
All ACs verified. `arch review` OK, `npm test` 70/70. Archived.

## [2026-05-05 00:00] REVIEW_PASS | TASK-159, TASK-178, TASK-179, TASK-180, TASK-181, TASK-182
All ACs verified against repository state. `arch review` OK. Archived.

## [2026-05-05 00:00] REVIEW_REQUEST | TASK-184
**Task:** Add Census (context budget) check to arch review
**ACs:**
- [x] `arch.config.json` supports a `contextBudget` block mapping directory paths to line-count thresholds
- [x] New `Census` drift check in `DriftChecker` counts lines per configured directory
- [x] WARN emitted when threshold exceeded with PURGE or REFACTOR suggestion
- [x] `Census` check appears in `arch review` drift output
- [x] Default thresholds documented as example in `arch.config.json`
**Changed files:**
- arch.config.json
- cli/src/main/ts/domain/services/drift-checker.ts
- cli/src/test/ts/drift-checker.test.ts
- cli/dist/index.js
- docs/adr/ADR-007-census-context-budget-check.md
- docs/tasks/TASK-184.md

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
