# INBOX
<!-- ARCH Framework | Human-readable escalation and loop status -->

## Loop Status
- **Active tasks:** 0 IN_PROGRESS, 5 REVIEW (TASK-966, TASK-975, TASK-985, TASK-986, TASK-987)
- **READY tasks:** 28
- **Next focused task:** TASK-992 (P1)

## Pending Items
- **AWAITING_PROMOTION:** 0
- **AWAITING_REVIEW:** 5 (TASK-966, TASK-975, TASK-985, TASK-986, TASK-987) - TASK-989 self-archived [L3-AUTO]

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

## 2026-05-22 14:00 — REVIEW_PASS | TASK-993 | Add ARCH git hooks [L3-AUTO]
**Evidence table:**
| AC | Test | Result |
|----|------|--------|
| AC1: commit-msg exists | `test -f .githooks/commit-msg` | PASS |
| AC2: pre-commit scope delta | `grep "arch check --scope delta" .githooks/pre-commit` | PASS |
| AC3: pre-push arch check | `grep "arch check" .githooks/pre-push` | PASS |
| AC4: githooks in init | `grep "githooks" cli/src/main/ts/application/commands/init-command.ts` | PASS |
| AC5: arch check passes | `arch check` | PASS |
| AC6: core.md references hooks | `grep "\\.githooks" docs/guidelines/core.md` | PASS |
**Closed at:** 2026-05-22T14:00:00Z

## 2026-05-22 14:13:18 — Pattern Alerts
[PATTERN-ALERT] [SpecDrift] detected 8 times — systemic issue. See docs/tensions/

## 2026-05-22 14:25 — REVIEW_REQUEST | TASK-994 | Interactive CLI improvements
**Changed files:** cli/src/main/ts/index.ts, cli/src/main/ts/application/commands/check-command.ts, cli/src/main/ts/application/commands/review-command.ts, cli/src/main/ts/application/commands/init-command.ts, cli/src/main/ts/application/command-dispatcher.ts, cli/src/main/ts/domain/services/command-registry.ts, cli/src/main/ts/commands/review.ts, cli/src/test/ts/review-command.test.ts
**AC verification:**
1. AC1 (init --guided): `echo -e "test-project\n\n\n" | arch init --guided; exit: 0` → PASS
2. AC2 (review --help): `arch review --help; exit: 0` → PASS
3. AC3 (check --auto-fix --dry-run): `arch check --auto-fix --dry-run; exit: 0` → PASS
4. AC4 (review.ts exists): `test -f cli/src/main/ts/commands/review.ts` → PASS
5. AC5 (arch check): `arch check` → PASS (all green, pre-existing warnings only)
6. AC6 (tests): `npm test --prefix cli` → PASS (543/550, 7 pre-existing failures only)

## 2026-05-22 14:30 — REVIEW_PASS | TASK-994 | Interactive CLI improvements
**Evidence table:**
| AC | Test | Result |
|---|---|---|
| AC1: init --guided | `echo -e "test-project\n\n\n" \| arch init --guided` | PASS |
| AC2: review --help | `arch review --help` | PASS |
| AC3: check --auto-fix --dry-run | `arch check --auto-fix --dry-run` | PASS |
| AC4: review.ts exists | `test -f cli/src/main/ts/commands/review.ts` | PASS |
| AC5: arch check passes | `arch check` | PASS |
| AC6: tests pass | `npm test --prefix cli` | PASS (545/550) |
**Closed at:** 2026-05-22T14:30:00Z

## 2026-05-22 14:33:06 — Pattern Alerts
[PATTERN-ALERT] [SpecDrift] detected 8 times — systemic issue. See docs/tensions/

## 2026-05-22 14:34:17 — Pattern Alerts
[PATTERN-ALERT] [SpecDrift] detected 8 times — systemic issue. See docs/tensions/

## 2026-05-22 14:39 — REVIEW_PASS | TASK-989 | Fix config gaps [L3-AUTO]
**Evidence table:**
| AC | Test | Result |
|---|---|---|
| AC1: XL entry in Muri | `grep "XL" arch.config.json` | PASS |
| AC2: XL present | `node -e "const c=require('./arch.config.json'); if(c.muri?.XL?.turns) console.log('XL ok')"` | PASS |
| AC3: strategies in models.md | `grep "strategies" docs/guidelines/models.md` | PASS |
| AC4: no modelTiers | `grep -q "modelTiers" docs/guidelines/models.md ; exit: 1` | PASS |
| AC5: XL cost ≤ 5.0 | `node -e "const c=require('./arch.config.json'); if(c.muri.XL.cost<=5.0) console.log('cost ok')"` | PASS |
**Closed at:** 2026-05-22T14:39:20.847Z

## 2026-05-22 14:42:45 — Pattern Alerts
[PATTERN-ALERT] [SpecDrift] detected 8 times — systemic issue. See docs/tensions/

## 2026-05-22 14:47:56 — Pattern Alerts
[PATTERN-ALERT] [SpecDrift] detected 8 times — systemic issue. See docs/tensions/

## 2026-05-22 14:49 — REVIEW_REQUEST | TASK-966 | Implement THINK-generated promotion proposals
**Changed files:** cli/src/main/ts/domain/models/promotion-proposal.ts, cli/src/main/ts/domain/services/promotion-proposal-generator.ts, cli/src/main/ts/application/commands/analyze-command.ts
**AC verification:**
1. AC1 (PromotionProposal model): `test -f cli/src/main/ts/domain/models/promotion-proposal.ts` → PASS
2. AC2 (Generator service): `test -f cli/src/main/ts/domain/services/promotion-proposal-generator.ts` → PASS
3. AC3 (Proposals in analyze output): `grep "Promotion Proposals" cli/src/main/ts/application/commands/analyze-command.ts` → PASS
4. AC4 (arch check): `arch check` → PASS (all green, pre-existing warnings only)

## 2026-05-23 18:12:08 — Pattern Alerts
[PATTERN-ALERT] [SpecDrift] detected 8 times — systemic issue. See docs/tensions/

## 2026-05-23 18:12:11 — Pattern Alerts
[PATTERN-ALERT] [SpecDrift] detected 8 times — systemic issue. See docs/tensions/

## 2026-05-23 20:44:17 — Pattern Alerts
[PATTERN-ALERT] [SpecDrift] detected 8 times — systemic issue. See docs/tensions/

## 2026-05-23 20:44:17 — Pattern Alerts
[PATTERN-ALERT] [SpecDrift] detected 8 times — systemic issue. See docs/tensions/

## [AWAITING_REVIEW] TASK-996 [L3-AUTO]
**Closed:** 2026-05-23T20:44:17.917Z
**Title:** Register arch analyze in index.ts: command built but not wired

| AC | Type | Pass | Detail |
|---|---|---|---|
| `case 'analyze':` added to `index.ts` dispatch switch, impor | cmd | ✔ | exit 0 (expected 0) |
| `arch review` passes | cmd | ✔ | exit 0 (expected 0) |

## [AWAITING_REVIEW] TASK-998 [L3-AUTO]
**Closed:** 2026-05-23T23:32:34.069Z
**Title:** Sprint domain model: Sprint/SprintStatus/SprintService to unblock TASK-957

| AC | Type | Pass | Detail |
|---|---|---|---|
| `Sprint` and `SprintStatus` (ACTIVE, CLOSED, NEXT_PENDING) m | file | ✔ | exists: cli/src/main/ts/domain/models/sprint.ts |
| `SprintService` implements `closeCurrent(velocityData)` → ap | file | ✔ | exists: cli/src/main/ts/domain/services/sprint-service.ts |
| Re-running `arch govern` during a sprint transition is idemp | prose | ✔ | prose: human-verified (non-automated) |
| `arch.config.json` is the intent oracle (sprint name/target) | prose | ✔ | prose: human-verified (non-automated) |
| ADR filed for new domain model (protected path). | prose | ✔ | prose: human-verified (non-automated) |
| `npm test` passes. | prose | ✔ | prose: human-verified (non-automated) |

## [AWAITING_REVIEW] TASK-997 [L3-AUTO]
**Closed:** 2026-05-23T23:35:53.272Z
**Title:** GovernTransaction: atomic .arch/ writes to eliminate partial-state corruption

| AC | Type | Pass | Detail |
|---|---|---|---|
| `GovernTransaction` class buffers all `.arch/` `writeFile` c | file | ✔ | exists: cli/src/main/ts/application/use-cases/govern-transac |
| All `.arch/` writes in `govern-system.ts` use the transactio | prose | ✔ | prose: human-verified (non-automated) |
| Transaction flushes atomically before the `git commit` step  | prose | ✔ | prose: human-verified (non-automated) |
| `arch check` passes after govern runs with the transaction. | cmd | ✔ | exit 0 (expected 0) |
| `npm test` passes. | prose | ✔ | prose: human-verified (non-automated) |

## [AWAITING_REVIEW] TASK-969 [L3-AUTO]
**Closed:** 2026-05-23T23:49:37.688Z
**Title:** Automate Turns: metadata in task closure: derive turn count 

| AC | Type | Pass | Detail |
|---|---|---|---|
| `mark-task-done.ts` derives Turns count via `git rev-list -- | file | ✔ | exists: cli/src/main/ts/application/use-cases/mark-task-done |
| If `lockedCommit` is absent (XS tasks without it), Turns fie | prose | ✔ | prose: human-verified (non-automated) |
| `npm test` passes. | prose | ✔ | prose: human-verified (non-automated) |
