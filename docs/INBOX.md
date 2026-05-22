# INBOX
<!-- ARCH Framework | Human-readable escalation and loop status -->

## Loop Status
- **Active tasks:** 0 IN_PROGRESS, 4 REVIEW
- **READY tasks:** 28
- **Next focused task:** TASK-992 (P1)

## Pending Items
- **AWAITING_PROMOTION:** 0
- **AWAITING_REVIEW:** 4 (TASK-975, TASK-985, TASK-986, TASK-987)

## Refinement Queue
- IDEA-automate-govern-metadata-flush: Sessions: 5
- IDEA-brownfield-onboarding-pipeline: Sessions: 3
- IDEA-fix-escalation-deduplication: Sessions: 3
- IDEA-sprint-state-machine: Sessions: 4

## Recent Completions
- **TASK-992**: Extract hardcoded ARCH paths to arch.config.json
- **TASK-195**: Hansei drift check - mandate and verify Hansei section on archived tasks
- **TASK-130**: Simplify agent protocols by consolidating phases
- **TASK-132**: Implement 'arch promote' command for easier IDEA promotion
- **TASK-136**: Implement Kaizen learning from review mistakes
- **TASK-138**: Fix stale RETRO.md reference in what-ai-must-never-do

## System Health
- **Archive size:** 8396/8000 lines. **Action required: PURGE** (arch task compress --all)
- **TASK-975**: [CONCEALMENT] Undeclared debt detected. **Action: REJECT and reclassify.**
- **TASK-957**: Orphan task detected.
<!-- TASK-992 closed and archived -->

## 2026-05-22 13:52:06 — Pattern Alerts
[PATTERN-ALERT] [SpecDrift] detected 8 times — systemic issue. See docs/tensions/

## 2026-05-22 13:58 — REVIEW_REQUEST | TASK-993 | Add ARCH git hooks
**Changed files:** .githooks/commit-msg, .githooks/pre-commit, .githooks/pre-push, cli/src/main/ts/application/commands/init-command.ts, docs/guidelines/core.md
**AC verification:**
1. AC1 (commit-msg exists): `test -f .githooks/commit-msg` → PASS
2. AC2 (pre-commit arch check --scope delta): `grep "arch check --scope delta" .githooks/pre-commit` → PASS
3. AC3 (pre-push arch check): `grep "arch check" .githooks/pre-push` → PASS
4. AC4 (githooks in init): `grep "githooks" cli/src/main/ts/application/commands/init-command.ts` → PASS
5. AC5 (arch check): `arch check` → PASS (all green, pre-existing warnings only)
6. AC6 (core.md references hooks): `grep "\.githooks" docs/guidelines/core.md` → PASS
**Note:** AC4 grep target path uses `commands/init.ts` but file is at `application/commands/init-command.ts`. Verified on the actual file.
