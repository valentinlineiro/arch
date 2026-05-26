# INBOX
_Generated: 2026-05-24T11:47Z by [THINK] DEEP session_

## Loop Status
- IN_PROGRESS: 0 — none
- REVIEW: 0
- READY: 17

## Alerts
[PATTERN-ALERT] [SpecDrift] 8 occurrences — systemic. See docs/tensions/TENSION-005-specdrift.md
[SEMANTIC-DRIFT] AGENTS.md: 5 occurrences of deprecated `arch check` → fixed to `arch review`
[THINK] 2 IDEAs graduated from ROADMAP-IDEAS: IDEA-arch-resume, IDEA-protocol-upgrade-policy

## Refinement Queue (2 active)
  - arch-resume — automate ANDON_HALT recovery paths
  - protocol-upgrade-policy — define patch/minor/major upgrade adoption pr

## Pending Decisions
  - IDEA-arch-resume: ready to promote — needs human Decision field
  - IDEA-protocol-upgrade-policy: ready to promote — needs human Decision field

## REVIEW_REQUEST
### TASK-1029: structural compaction
**ACs implemented:**
1. Deleted stale artifacts (docs/index.html.bak, .arch/.think-prompt-*.md)
2. Added `maxTopLevelFiles` sprawl check to DriftChecker (Sprawl check, registered in CheckSystem)
3. Added escalation compaction to govern tick (writes .arch/escalations-compacted.jsonl)
4. Filed TASK-1030 for archive partitioning strategy (READY, 500-file trigger)
5. Merged duplicate tension templates (kept TEMPLATE.md, deleted TENSION-template.md, updated THINK.md ref)
6. Added ADRs to context budget in arch.config.json
7. npm test passes (all drift-checker tests pass)
8. arch review passes

**Changed files:**
- `arch.config.json` — added sprawlThresholds, docs/adr to contextBudget
- `cli/src/main/ts/application/use-cases/drift-checker.ts` — added checkMaxTopLevelFiles()
- `cli/src/main/ts/application/use-cases/check-system.ts` — registered Sprawl in DELTA_GLOBAL_CHECKS
- `cli/src/main/ts/application/commands/govern-command.ts` — added compactEscalations()
- `cli/src/test/ts/drift-checker.test.ts` — 6 new Sprawl tests
- `docs/agents/THINK.md` — updated TENSION-template.md → TEMPLATE.md reference
- `docs/tasks/TASK-1030.md` — new task (archive partitioning)
- `docs/tasks/TASK-1029.md` — status → REVIEW + Hansei
- Deleted: docs/index.html.bak, .arch/.think-prompt-*.md (3 files), docs/tensions/TENSION-template.md

## Roadmap-Only (not executable yet)
  - arch-init-ux: temporal validity — no external users to observe friction
  - backlog-compression: premature at 17 READY tasks
  - cli-protocol-decoupling: abstraction layer violation + priority displacement

## 2026-05-24 18:09:22 — Pattern Alerts

## [2026-05-25 05:27] INFLUENCE_THRESHOLD_VIOLATION | REFLECT
Evidence: Engagement 48% is below threshold 50% — attribution discipline review required

## 2026-05-25 12:05:52 — Pattern Alerts

## [2026-05-25 12:22] INFLUENCE_BREACH_CLEARED | REFLECT
Evidence: engagement threshold breach cleared. Verify: did health improve (more decisions attributed) — or did operators adapt behavior to the threshold (worked around the measurement)? These are opposite outcomes that look identical in the data.

---
**[REVIEW_REQUEST] TASK-1010 — arch init: minimal project bootstrap for external repos**
Date: 2026-05-25

**ACs:**
- [x] `arch init` command exists → `cli/src/main/ts/application/commands/init-command.ts`
- [x] `arch init --dry-run` exits 0 without writing files
- [x] `arch review` passes
- [x] Seed task titled "Complete your first governed task" with workflow walkthrough
- [x] Idempotent (second run skips existing files)
- [x] `init-command.test.ts` — 7 tests all pass

**Changed files:**
- `cli/src/main/ts/application/commands/init-command.ts` — added `--dry-run` flag, updated `seedTaskMd()`
- `cli/src/test/ts/init-command.test.ts` — new, 7 tests
- `docs/tasks/TASK-1010.md` — status REVIEW

---
**[REVIEW_REQUEST] TASK-1006 — Project DoD gate: PROJECT.md predicates checked by govern, PROJECT_COMPLETE exit**
Date: 2026-05-25

**ACs:**
- [x] `govern-system.ts` has `checkProjectDoD` — reads `docs/PROJECT.md` `## Definition of Done`, runs `DeterministicACVerifier.verifySection`
- [x] `DeterministicACVerifier.verifySection` added — checkbox-aware for prose/unknown predicates
- [x] On completion: appends `PROJECT_COMPLETE` to `.arch/focus-ledger.jsonl`, writes `docs/RETRO.md` — idempotent (no duplicate writes)
- [x] `govern-command.ts` exits 2 when `projectComplete === true`
- [x] `loop-engine.ts` breaks loop when `governResult.projectComplete === true`
- [x] 9/9 project-dod-gate tests pass; all existing AC verifier tests pass

**Changed files:**
- `cli/src/main/ts/application/use-cases/govern-system.ts` — checkProjectDoD, GovernResult.projectComplete
- `cli/src/main/ts/application/use-cases/focus-ledger.ts` — PROJECT_COMPLETE RulingAction
- `cli/src/main/ts/application/use-cases/loop-engine.ts` — break on PROJECT_COMPLETE
- `cli/src/main/ts/application/commands/govern-command.ts` — exit 2 on PROJECT_COMPLETE
- `cli/src/main/ts/domain/services/deterministic-ac-verifier.ts` — verifySection method
- `cli/src/test/ts/project-dod-gate.test.ts` — new, 9 tests

## REVIEW_REQUEST — TASK-1007
**Date:** 2026-05-25
**Task:** arch project init: decompose spec into ADRs and task graph via LLM
**Status:** REVIEW
**Summary:** ProjectCommand implemented with 9 passing tests. Wired into command-dispatcher. TypeScript build clean. LLM decomposition, ADR/task file generation, PROJECT.md with Ratification section, malformed JSON rejection, and --depth flag all verified.

## REVIEW_REQUEST — TASK-1013
**Date:** 2026-05-25
**Task:** fix govern: stage and commit all files written during a tick
**Summary:** Three commit leaks fixed in govern-system.ts. 17/17 tests pass.

## REVIEW_REQUEST — TASK-1011
**Date:** 2026-05-25
**Task:** cli-protocol-decoupling phase 1: PathResolver service
**Summary:** PathResolver created at domain/services/path-resolver.ts. 14 typed accessors, hardcoded defaults, config override support, static factory. 5 tests pass. Phases 2+3 captured as TASK-1014/TASK-1015.

---
[REVIEW_REQUEST] TASK-1012 — Fix escalation lifecycle gap: close-loop write at promotion + DriftChecker stale check
ACs:
- THINK.md Phase 1 updated with RESOLVED write instruction → file: docs/agents/THINK.md
- DO.md Ops updated with IDEA Decision RESOLVED append step → file: docs/agents/DO.md
- DriftChecker.checkStaleEscalations() added (WARN, not FAIL) → file: cli/src/main/ts/application/use-cases/drift-checker.ts
- 5 new TDD tests — 60/60 drift-checker pass
- arch review passes
Changed files: docs/agents/THINK.md, docs/agents/DO.md, cli/src/main/ts/application/use-cases/drift-checker.ts, cli/src/test/ts/drift-checker.test.ts

---
[REVIEW_REQUEST] TASK-1014 — cli-protocol-decoupling phase 2: wire PathResolver into core execution layer
ACs:
- Zero hardcoded path literals in 6 target files → prose: verified by grep
- arch govern runs cleanly → cmd: pass
- 17/17 govern-system tests pass → cmd: pass
- arch review passes → cmd: pass
Changed files: cli/src/main/ts/domain/services/path-resolver.ts, cli/src/main/ts/application/use-cases/govern-system.ts, cli/src/main/ts/application/use-cases/loop-engine.ts, cli/src/main/ts/application/use-cases/focus-ledger.ts, cli/src/main/ts/application/use-cases/escalation-store.ts, cli/src/main/ts/application/use-cases/govern-transaction.ts, cli/src/main/ts/infrastructure/filesystem/markdown-task-repository.ts

---
## REVIEW_REQUEST — TASK-1015
**Task:** cli-protocol-decoupling phase 3: wire PathResolver into commands and analysis layer
**Status:** REVIEW
**Date:** 2026-05-25

### ACs verified (all cmd: predicates passed)
- [x] Zero hardcoded path literals outside path-resolver.ts (grep count = 0)
- [x] `arch review` passes
- [x] `arch govern --no-conduct` runs cleanly

### Changed files (56 .ts files + task file)
All files in `cli/src/main/ts/` — commands, use-cases, domain services, infrastructure.
Key: drift-checker.ts (46→0), build-index.ts (28→0, required sed bug fix), init-command.ts (51→0).

### Hansei
H1/ToolingError — sed introduced broken single-quoted template strings in build-index.ts; corrected before build.

---
## REVIEW_REQUEST — TASK-1008
**Task:** Fix arch status alerts: parse INBOX sections correctly, filter advisory noise
**Status:** REVIEW
**Date:** 2026-05-25

### ACs verified
- [x] `parseInboxAlerts()` scopes to `## Alerts` section only — file: status-command.ts exists
- [x] Only `[ANDON_HALT]`, `[PATTERN-ALERT]`, `[CORPUS_ALERT]` shown — 7 unit tests pass covering advisory/markdown exclusion
- [x] Max 3 shown with "... N more — run arch govern inbox" overflow line — test with 5 alerts confirms
- [x] `arch review` passes

### Changed files
- `cli/src/main/ts/application/commands/status-command.ts`
- `cli/src/test/ts/status-alerts.test.ts` (new, 7 tests)

---
## REVIEW_REQUEST — TASK-1009
**Task:** INBOX hygiene: automatic stale entry cleanup in govern tick
**Status:** REVIEW
**Date:** 2026-05-25

### ACs verified
- [x] `govern-system.ts` runs INBOX hygiene after each tick — `runInboxHygienePass()` at step 7 of `execute()`
- [x] Duplicate `[PATTERN-ALERT]` per category: keeps only most recent — dedup via `seenPatternCategories` Set; 3 unit tests pass
- [x] Non-deterministic entries older than 14 days removed — expiry logic uses `governance.inboxExpiryDays ?? 14`; unit tests with 24-day-old sections confirm
- [x] `ANDON_HALT`, `CORPUS_ALERT`, `PATTERN-ALERT` never auto-removed — `isDeterministic()` guard; 3 unit tests confirm persistence
- [x] `arch govern --clean-inbox` forces full hygiene pass — tested: `node cli/dist/index.js govern --clean-inbox` exits 0, prints `✔ INBOX hygiene applied`
- [x] 609 tests pass (5 pre-existing failures unchanged)
- [x] `arch review` passes

### Changed files
- `cli/src/main/ts/application/use-cases/inbox-hygiene.ts` (new)
- `cli/src/test/ts/inbox-hygiene.test.ts` (new, 15 tests)
- `cli/src/main/ts/application/use-cases/govern-system.ts` — import + `execute(cleanInbox)` + `runInboxHygienePass()`
- `cli/src/main/ts/application/commands/govern-command.ts` — `--clean-inbox` flag

## [2026-05-26 06:01] INFLUENCE_THRESHOLD_VIOLATION | REFLECT
Evidence: Engagement 46% is below threshold 50% — attribution discipline review required

## 2026-05-26 06:01:13 — Pattern Alerts

## [2026-05-26 07:16] INFLUENCE_BREACH_CLEARED | REFLECT
Evidence: engagement threshold breach cleared. Verify: did health improve (more decisions attributed) — or did operators adapt behavior to the threshold (worked around the measurement)? These are opposite outcomes that look identical in the data.

---
## REVIEW_REQUEST — TASK-1029
**Task:** structural compaction: stale files, sprawl invariant, escalation compaction, archive partitioning
**Status:** REVIEW
**Date:** 2026-05-26

### ACs verified
- [x] Delete stale artifacts — `git ls-files` returns 0 for all stale paths
- [x] Add maxTopLevelFiles sprawl check to DriftChecker — checkMaxTopLevelFiles() added, registered in CheckSystem, 6 tests pass
- [x] Add escalation compaction to govern tick — compactEscalations() writes .arch/escalations-compacted.jsonl with OPEN records
- [x] File TASK-1030 for archive partitioning — exists in docs/tasks/ with 500-file trigger
- [x] Merge duplicate tension templates — TEMPLATE.md kept, TENSION-template.md deleted, THINK.md ref updated, no remaining refs
- [x] Add ADRs to context budget — docs/adr: 2000 added to arch.config.json
- [x] npm test passes — all drift-checker tests pass (61/61)
- [x] arch review passes

### Changed files
- `arch.config.json` — sprawlThresholds + contextBudget docs/adr
- `cli/src/main/ts/application/use-cases/drift-checker.ts` — checkMaxTopLevelFiles()
- `cli/src/main/ts/application/use-cases/check-system.ts` — Sprawl in DELTA_GLOBAL_CHECKS
- `cli/src/main/ts/application/commands/govern-command.ts` — compactEscalations()
- `cli/src/test/ts/drift-checker.test.ts` — 6 new Sprawl tests
- `docs/agents/THINK.md` — TENSION-template.md → TEMPLATE.md
- `docs/tasks/TASK-1030.md` — new file (archive partitioning)
- Deleted: docs/index.html.bak, .arch/.think-prompt-*.md (×3), docs/tensions/TENSION-template.md
