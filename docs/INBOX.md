# INBOX
_Generated: 2026-06-02 by [THINK] session_

## Loop Status
- IN_PROGRESS: 4 (TASK-1081, 1082, 1083, 1084)
- REVIEW: 0
- READY: 1 (TASK-1080 — P1/L | Focus:yes)
- BLOCKED: 0

## Alerts
[PATTERN-ALERT] [SpecDrift] — see docs/tensions/TENSION-005-specdrift.md

## Refinement Queue (12 active files in docs/refinement/, excluding archive + TEMPLATE)

### DRAFT (3)
- IDEA-auto-task-turns — automatic Turns counter on commit (Sessions: 1) [NEW]
- IDEA-escalations-archive-compaction — prunes old RESOLVED records from escalations.jsonl (Sessions: 2)
- IDEA-influence-breach-condensation — caps identical consecutive INFLUENCE_BREACH_PERSISTENT alerts at 5 (Sessions: 1)

### PROMOTED (6)
- IDEA-arch-release-and-cd, IDEA-context-injector-planned-artifact-projection, IDEA-modular-activation, IDEA-phase-aware-sprint-close, IDEA-stub-e2e-coverage-prompt, IDEA-xs-close-path-completion

### DEFERRED (3)
- IDEA-chronicle-govern-coverage, IDEA-dual-truth-reconciliation, IDEA-promotion-decision-support

## Roadmap-Only (11 entries, not executable yet)
See docs/refinement/ROADMAP-IDEAS.md

## Last 5 Completed Tasks
1. TASK-1079 — Context injector planned artifact projection fix (P2/S)
2. TASK-1078 — ARCH release and CD pipeline: automated version bump + npm publish (P2/M)
3. TASK-1077 — Phase-aware sprint close: sprintCloseOn milestone predicate (P2/S)
4. TASK-1076 — XS lightweight close path: auto-close when all cmd predicates pass (P2/S)
5. TASK-1075 — Primary user flow gate when AC stubs an endpoint (P1/S)

## Pending REVIEW_REQUESTS

## REVIEW_REQUEST | TASK-1080
**Title:** arch modular activation: archProfile + modules block in arch.config.json
**ACs:**
- archProfile profiles (minimal/standard/full) with module overrides
- Hansei non-blocking advisory mode
- DriftChecker group filtering
- Govern subsystem gating (sprint/corpus/coreFlows)
- arch init interactive profile prompt
- Backward compatible (absence defaults to full)
**Changed files:**
- arch.config.json
- cli/src/main/ts/domain/models/config.ts
- cli/src/main/ts/application/use-cases/mark-task-done.ts
- cli/src/main/ts/application/use-cases/drift-checker.ts
- cli/src/main/ts/application/use-cases/check-system.ts
- cli/src/main/ts/application/use-cases/govern-system.ts
- cli/src/main/ts/application/commands/init-command.ts
**Tests:** 708/708 pass

## AWAITING_PROMOTION
IDEA-auto-task-turns | 2026-06-02 — DRAFT, no Decision field set [NEW]
IDEA-escalations-archive-compaction | 2026-06-02 — DRAFT, no Decision field set
IDEA-influence-breach-condensation | 2026-06-02 — DRAFT, no Decision field set
