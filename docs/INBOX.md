# INBOX
<!-- Weekly dashboard for human-agent coordination -->
<!-- Generated on: 2026-05-08 -->

## Status Summary
- **Active Tasks:** 0
- **In Review:** 2 (TASK-202, TASK-205)
- **Backlog (Ready):** 18

## Urgent / Actions Required
_No urgent actions._

## Refinement Queue
55 pending IDEAs:
approval-entry-check, arch-core-contract, arch-review-dependency-graph, auto-sprint-sizing, census-context-budget-review-check, cli-npm, consolidate-cli-commands, context-control, cost-aware-protocol, cross-repo-learning-network, do-step-registry-for-kaizen, dynamic-model-provisioning, feature-branch-workflow, formal-protocol-invariants, grandfather-legacy-tasks, handle-parallelism, hansei-reflection-on-done-tasks, idea-ttl-auto-rejection, institutional-memory-document, interactive-test, loop-load-balancing, loop-mode-output-visibility, multi-human-governance, multi-repo-arch, mura-turns-per-size-metric, open-standard-portability, openclaw-integration, openrouter-groq-free-tier-fallback, optimize-decomposition-for-local-llms, oracle-archive-distillation, parallel-tasks, probabilistic-trust-model, protocol-replay-regression, prune-stale-documentation, rag-context-retrieval, roadmap-adaptive-planning, roadmap-ai-proposed-policies, roadmap-arch-capture, roadmap-auto-context-engine, roadmap-automatic-linking, roadmap-domain-packs, roadmap-drift-detection, roadmap-memory-queries, roadmap-multiagent-runtime, roadmap-operational-load, roadmap-routing-engine, roadmap-structural-policies, sentinel-log-infrastructure, separate-arch-core-from-content, task-execution-plans, task-idea-metrics-context-price, task-template-linter, testing-guideline-expansion, typed-protocol-schema, value-cost-task-ordering, verbose-fallback-logging

## Current Sprint
_No active sprint._

## Recent Activity
- **Last Commit:** chore: [THINK] Phase 1 — Context & Replenishment
- **Completed:** TASK-220 (Automatic entity linking — guidelines↔failures), TASK-219 (Add Intent domain model), TASK-216 (Reflect strategic roadmap into ROADMAP.md and IDEA files), TASK-218 (Automatic entity linking — ADRs↔tasks), TASK-217 (Automatic entity linking - tasks-to-commits)

## [2026-05-12] REVIEW_REQUEST | TASK-200 | arch task compress
All cmd: predicates verified: `arch review` exits 0, `npm test --prefix cli` passes (388 tests).
AC1 (`test -f docs/archive/TASK-200.md`) is self-referential — passes only after Auditor archives this task.
Prose ACs verified manually: compressed TASK-222 to inspect format, ran `arch validate --acs TASK-222`.
Census PURGE message now includes `arch task compress --all`.
Changed files: `cli/src/main/ts/application/use-cases/compress-task.ts` (new), `cli/src/test/ts/compress-task.test.ts` (new), `cli/src/main/ts/application/commands/task-command.ts`, `cli/src/main/ts/application/use-cases/drift-checker.ts`, `docs/archive/TASK-222.md` (compressed).

## [2026-05-08] PHASE_1 | INTENT-001
Verified `arch capture` functionality. SIGNALed.

## [2026-05-06] REVIEW_PASS | TASK-193
All ACs verified. `arch next` prints highest-priority task, respects focus, and halts on P0 stale locks or budget exceedance. Archived.
