# INBOX
<!-- Weekly dashboard for human-agent coordination -->
<!-- Generated on: 2026-05-12 -->

## Status Summary
- **Active Tasks:** 0
- **In Review:** 0
- **Backlog (Ready):** 15

## Urgent / Actions Required
_No urgent actions._

## Refinement Queue
37 pending IDEAs:
architectural-tension-capture, backfill-legacy-hansei, cli-npm, consolidate-autonomy-rules, context-control, cross-layer-coverage-identity, docs-clarification-json-rule, docs-drift-guidelines-file-reference, dynamic-model-provisioning, escalation-event-structured-store, excision-legitimacy-check, feature-branch-workflow, govern-reflect-split, grandfather-legacy-tasks, level-terminology-disambiguation, link-unapplied-adrs, loop-load-balancing, loop-mode-output-visibility, openclaw-integration, optimize-decomposition-for-local-llms, parallel-tasks, rag-context-retrieval, roadmap-adaptive-planning, roadmap-ai-proposed-policies, roadmap-auto-context-engine, roadmap-automatic-linking, roadmap-domain-packs, roadmap-drift-detection, roadmap-memory-queries, roadmap-multiagent-runtime, roadmap-operational-load, roadmap-routing-engine, roadmap-structural-policies, sentinel-log-infrastructure, task-template-linter, think-replenishment-link, verbose-fallback-logging

## Current Sprint
_No active sprint._

## Recent Activity
- **Last Commit:** docs: [THINK] escalation IDEA — close shadow inference surface loophole
- **Completed (last 5):** TASK-229 (Fix generate-inbox IDEA status filter), TASK-228 (Wire causal signal generation into arch task done and arch govern), TASK-227 (Relocate drift-checker to application layer and define domain boundary), TASK-226 (Wire feedback capture into LoopEngine task completion), TASK-225 (Causal signal arbitration layer)

## [2026-05-12] AWAITING_PROMOTION | IDEA-govern-reflect-split

**Constraint-space analysis:** All five axes evaluated — none violated.
- Dependency ordering: no blocking prerequisites
- Temporal validity: evidence base is IDENTITY.md §7, which already articulates this split
- Abstraction layer: CLI command surface is the correct layer for naming/identity fixes
- Observability validity: no measurement required; structural change
- Priority displacement: directly named in IDENTITY.md §7 as a target; prevents specific degradation ("THINK already participates in govern, so it can also…")

**Structural position:** Sits in a region of the constraint space where no known axis is violated. Should be done before any feature that expands THINK's output surface.

**Decision required:** PROMOTE → TASK-XXX (write task number in IDEA file) or REJECT with rationale.

## [2026-05-13 10:00] REVIEW_REQUEST | TASK-190
**Task:** Implement L3 sprint autonomy (arch loop --sprint)
**ACs:**
- [x] `arch loop --sprint <slug>` scopes to sprint tasks only (prose: verify sprint filter works end-to-end)
- [x] Sprint halts with ANDON_HALT if >2 consecutive Andon conditions (prose: verify counter resets on success)
- [x] SPRINT_CHECKPOINT written at 50% (prose: verify checkpoint pauses loop and --resume continues)
- [x] `docs/guidelines/autonomy.md` documents L3 eligibility (file: docs/guidelines/autonomy.md)
- [x] `arch review` passes (cmd: ./scripts/arch.sh review)
- [x] `npm test` passes in `cli/` (cmd: npm test)
**Changed files:** cli/src/main/ts/application/use-cases/loop-engine.ts, cli/src/main/ts/application/use-cases/select-next-task.ts, cli/src/test/ts/loop-sprint.test.ts, docs/agents/DO.md, docs/guidelines/autonomy.md

## [2026-05-13 10:30] REVIEW_PASS | TASK-190
All ACs verified against repository state. sprint scoping, Andon count, checkpoint, and autonomy.md all confirmed. arch review OK, npm test 341 pass (6 pre-existing). Archived.
