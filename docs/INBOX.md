# INBOX
<!-- Weekly dashboard for human-agent coordination -->
<!-- Generated on: 2026-05-13 -->

## Status Summary
- **Active Tasks:** 0
- **In Review:** 0
- **Backlog (Ready):** 32

## Urgent / Actions Required
_No urgent actions._

## Refinement Queue
22 pending IDEAs:
architectural-tension-capture, context-control, cross-layer-coverage-identity, dynamic-model-provisioning, excision-legitimacy-check, feature-branch-workflow, grandfather-legacy-tasks, loop-load-balancing, openclaw-integration, optimize-decomposition-for-local-llms, parallel-tasks, rag-context-retrieval, roadmap-adaptive-planning, roadmap-ai-proposed-policies, roadmap-automatic-linking, roadmap-domain-packs, roadmap-memory-queries, roadmap-multiagent-runtime, roadmap-operational-load, roadmap-structural-policies, sentinel-log-infrastructure, task-template-linter

## Current Sprint
_No active sprint._

## Recent Activity
- **Last Commit:** docs: [THINK] Phase 1 — Context & Replenishment
- **Completed (last 5):** TASK-230 (Separate arch govern from arch reflect), TASK-190 (Implement L3 sprint autonomy), TASK-229 (Fix generate-inbox IDEA status filter), TASK-186 (Consolidate CLI - absorb validate and lint into review), TASK-185 (Consolidate CLI - merge read-only subcommands into task)

## [2026-05-13 14:00] THINK_REPLENISHMENT
**Context:** THINK mode executed. 0 active tasks detected. Backlog has 32 READY tasks.
**Refinement:** 3 IDEAs evaluated.
- `architectural-tension-capture`: Admissible (L).
- `context-control`: Admissible (S).
- `cross-layer-coverage-identity`: DEFERRED (blocked by `arch ask` v1).
**Semantic Drift:**
- `ADR-013` mentions Phase 3.5, but `THINK.md` says 2.5. Corrected in Phase 2.5 analysis.
- `Mura`: 0 signals recorded. `KAIZEN-LOG.md` proposal for automated turn-count recording is high priority.

## [2026-05-13 14:15] AWAITING_PROMOTION | IDEA-architectural-tension-capture
**Decision required:** PROMOTE → TASK-XXX or REJECT. Passes all 5 constraint axes. Essential for scaling ontological stability.

## [2026-05-13 14:15] AWAITING_PROMOTION | IDEA-excision-legitimacy-check
**Decision required:** PROMOTE → TASK-XXX or REJECT. Addresses additive legitimacy bias in DriftChecker. High value for keeping ontology lean.

## [2026-05-13 14:30] REVIEW_REQUEST | TASK-241
TASK-241 "Introduce .arch/escalations.jsonl structured escalation store" is ready for review.
All 7 ACs met. EscalationStore written to `.arch/escalations.jsonl` (append-only, OPEN/RESOLVED semantics). INBOX.md remains human-only. `arch inbox` now surfaces escalations from the structured store.

## [2026-05-13 15:00] REVIEW_REQUEST | TASK-209
TASK-209 "Fix commit message checker to recognize chore: [THINK] as governance tag" is ready for review.
All 5 ACs met. The `isGovernance` regex in `reviewer.ts:86` already handled `chore: [THINK]` correctly; this task added explicit test coverage for `chore: [THINK] Phase 1 — foo`, `chore: [KAIZEN]`, `chore: [SELF-PROMOTION]`, and a regression guard for commits without TASK-ID.
Changed files: `cli/src/test/ts/reviewer.test.ts`

## [2026-05-13 15:15] REVIEW_REQUEST | TASK-232
TASK-232 "Grandfather legacy tasks in arch review - silence Hansei warnings" is ready for review.
All 3 ACs met. Root cause: `checkHanseiPresent` read `config.hanseiSinceTaskId` but the value lives at `config.governance.hanseiSinceTaskId`. Fixed with a one-line fallback. `arch review` now shows only TASK-229 under HanseiPresent. Added 1 new test confirming the governance-nested path.
Changed files: `cli/src/main/ts/application/use-cases/drift-checker.ts`, `cli/src/test/ts/drift-checker.test.ts`

## [2026-05-13 15:30] REVIEW_REQUEST | TASK-238
TASK-238 "Disambiguate Level terminology - autonomy vs escalation scales" is ready for review.
All 3 ACs met. Decision: Autonomy keeps L1–L4 (lower churn, clearly qualified in context); Escalation Maturity renamed to E1–E7. Changed: ADR-010 title ("E3 Detectable"), body ("Autonomy L3+"), TASK-203 title ("E4 Fail-Closed"), TASK-204 title ("E5 Verifiable"), plus a disambiguation blockquote added to autonomy.md. grep confirms no remaining ambiguous "Level N" in guidelines/, adr/, agents/.
Changed files: docs/adr/ADR-010-escalation-maturity.md, docs/guidelines/autonomy.md, docs/tasks/TASK-203.md, docs/tasks/TASK-204.md

## [2026-05-13 15:45] REVIEW_REQUEST | TASK-239
TASK-239 "Stream arch loop output to terminal" is ready for review.
All 3 ACs met. Replaced `spawnSync` (stdio: pipe) with a private `runStreaming` helper using async `spawn` — tees stdout to `process.stdout` in real-time while buffering for metadata parsing. Added `quiet?: boolean` to `LoopOptions` to suppress streaming for non-interactive use.
Changed files: `cli/src/main/ts/application/use-cases/loop-engine.ts`

## [2026-05-13 16:00] REVIEW_REQUEST | TASK-240
TASK-240 "Verbose fallback logging for provider switching" is ready for review.
All 4 ACs met. Changes: (1) loop-command.ts wires --verbose/--quiet to LoopOptions; (2) loop-engine.ts logs full candidate list on --verbose and emits yellow ANSI "WARN — {name} failed: {reason} → next: {nextName}" on fallback; (3) exec-command.ts same improvements plus stderr block demarcation before WARN line; (4) fixed extraFlags to filter out --prefixed flags so --verbose isn't forwarded to the provider CLI.
Changed files: loop-engine.ts, exec-command.ts, loop-command.ts
