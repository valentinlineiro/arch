# INBOX
<!-- Weekly dashboard for human-agent coordination -->
<!-- Generated on: 2026-05-05 -->

## Status Summary
- **Active Tasks:** 0
- **In Review:** 1
- **Backlog (Ready):** 15

## Urgent / Actions Required
_No urgent actions._

## Refinement Queue
41 pending IDEAs:
anti-hallucination-acs, arch-review-dependency-graph, archive-compression, census-context-budget-review-check, cli-npm, conflict-resolver-agent, consolidate-cli-commands, context-control, cost-aware-protocol, cross-repo-learning-network, do-step-registry-for-kaizen, executable-acceptance-criteria, formal-protocol-invariants, handle-parallelism, hansei-reflection-on-done-tasks, idea-ttl-auto-rejection, institutional-memory-document, interactive-test, l3-sprint-autonomy, migrate-arch-sh-routing-to-typescript, multi-human-governance, multi-repo-arch, mura-turns-per-size-metric, native-llm-providers, open-standard-portability, openrouter-groq-free-tier-fallback, optimize-decomposition-for-local-llms, oracle-archive-distillation, parallel-tasks, periodic-architecture-revision, probabilistic-trust-model, protocol-replay-regression, prune-stale-documentation, queryable-archive, separate-arch-core-from-content, separate-arch-repo-from-cli, sprint-open-protocol, task-idea-metrics-context-price, task-template-linter, testing-guideline-expansion, typed-protocol-schema

## Current Sprint
_No active sprint._

## Recent Activity
- **Last Commit:** feat: [TASK-191] finalize conflict resolver safety and chronological sorting

## [2026-05-05 15:45] REVIEW_REQUEST | TASK-191
**Task:** Implement conflict resolver for trivial autonomous merge
**ACs:**
- [x] `DO.md` documents the conflict resolution protocol: auto-merge is permitted only for pure-append conflicts on `docs/INBOX.md` and `**Meta:**` status-line-only changes in `docs/tasks/*.md`; all other conflicts escalate to INBOX
- [x] `arch merge-resolve` command (or integrated into `arch loop`) detects merge conflicts after `git pull --rebase`, auto-resolves qualifying conflicts using chronological append order, and logs a `MERGE_AUTO` entry to INBOX
- [x] A `MERGE_ESCALATE` entry is written to INBOX for any conflict that does not meet the auto-merge criteria, halting the loop until human resolution
- [x] Auto-merge never touches `docs/adr/`, `arch.config.json`, or `cli/src/main/ts/domain/` (protected paths always escalate)
- [x] `arch review` passes
- [x] `npm test` passes in `cli/`
**Changed files:**
- docs/tasks/TASK-191.md
- docs/agents/DO.md
- README.md
- cli/src/main/ts/index.ts
- cli/src/main/ts/application/use-cases/merge-resolve.ts
- cli/src/main/ts/application/commands/merge-resolve-command.ts
- cli/src/main/ts/domain/services/task-validator.ts
- cli/src/main/ts/domain/services/drift-checker.ts
- cli/src/test/ts/merge-resolve.test.ts

## [2026-05-05 11:15] REVIEW_PASS | TASK-192, TASK-195, TASK-197
All ACs verified. TASK-192 Refinement Queue count confirmed. TASK-195 Hansei drift check verified by arch review. TASK-197 DO.md Hansei protocol alignment confirmed. Archived.

## [2026-05-05 12:30] REVIEW_REQUEST | TASK-195
**Task:** Hansei drift check - mandate and verify Hansei section on archived tasks
**ACs:**
- [x] `docs/TASK-FORMAT.md` marks `## Hansei` as a required section on DONE tasks
- [x] A `HanseiPresent` drift check in `DriftChecker` scans `docs/archive/*.md` and flags any task missing a `## Hansei` section as a named violation in `arch review`
- [x] `arch review` passes
- [x] `npm test` passes in `cli/`
**Changed files:**
- arch.config.json
- cli/src/main/ts/domain/services/drift-checker.ts
- cli/src/test/ts/drift-checker.test.ts
- docs/TASK-FORMAT.md
- docs/tasks/TASK-194.md
- docs/tasks/TASK-195.md

## [2026-05-05 00:00] REVIEW_PASS | TASK-188
All ACs verified. Review issues fixed: machine-enforceable Last-Revision trigger in KAIZEN-LOG.md, minimum data guard, full IDEA path spec, [REVISION] tag added to Output section. `arch review` OK. Archived.

## [2026-05-05 00:00] REVIEW_PASS | TASK-189
All ACs verified. Review issues fixed: status guard in MarkTaskReview, timeout detection with timedOut field, ValidateCommand routing through TaskRepository, and MarkTaskReview test suite (5 tests). `npm test` 82/82. Archived.
