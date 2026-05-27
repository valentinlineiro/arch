# INBOX
_Generated: 2026-05-26T10:04Z by [THINK] session_

## Loop Status
- IN_PROGRESS: 9 (TASK-1016, 1017, 1019, 1020, 1021, 1022, 1023, 1048, 1050)
- REVIEW: 0
- READY: 25
- BLOCKED: 1 (TASK-1024 — compliance front door, explicitly deferred)

## Alerts
[PATTERN-ALERT] [SpecDrift] systemic — see docs/tensions/TENSION-005-specdrift.md

## Refinement Queue (4 active)
- IDEA-chronicle-govern-coverage (EXTEND, sessions: 2)
- IDEA-dual-truth-reconciliation (EXTEND, sessions: 2)
- IDEA-idea-adjudication-throughput (EXTEND, sessions: 2)
- IDEA-promotion-decision-support (EXTEND, sessions: 2)

## Roadmap-Only (8 entries, not executable yet)
See docs/refinement/ROADMAP-IDEAS.md

## Last 5 Completed Tasks
1. TASK-1018 — rename arch check to arch review in docs (P2/S)
2. TASK-1040 — add c8 coverage reporting to npm test (P1/XS)
3. TASK-1032 — fix enforcement/analysis boundary: move SubprocessRunner call to command layer (P1/S)
4. TASK-1035 — move process.exit() to main entry point: commands return exit codes (P0/M)
5. TASK-1039 — fix 13 pre-existing test failures (P0/S)

## 2026-05-26 13:03:34 — Pattern Alerts

## 2026-05-26 13:11:34 — Pattern Alerts

## 2026-05-26 13:18:36 — Pattern Alerts

## 2026-05-26 13:20:42 — Pattern Alerts

## [2026-05-26 17:14] INFLUENCE_THRESHOLD_VIOLATION | REFLECT
Evidence: Engagement 48% is below threshold 50% — attribution discipline review required

## [2026-05-26 17:16] INFLUENCE_BREACH_PERSISTENT | REFLECT
Evidence: Persistent breach (3 consecutive cycles): Engagement 48% is below threshold 50% — attribution discipline review required

## [2026-05-26 22:43] INFLUENCE_BREACH_CLEARED | REFLECT
Evidence: engagement threshold breach cleared. Verify: did health improve (more decisions attributed) — or did operators adapt behavior to the threshold (worked around the measurement)? These are opposite outcomes that look identical in the data.

---
**REVIEW_REQUEST** | TASK-242 | 2026-05-27
Task: Ship CLI as standalone npm package
ACs verified:
- [x] CLI publishable as npm package → `@valentinlineiro/arch@1.2.0` live on npm, `file: cli/package.json` ✓
- [x] Installation documented in README → `## Install` section with `npm install -g @valentinlineiro/arch`, `file: README.md` ✓
- [x] All existing commands work post-package → `file: cli/dist/index.js` ✓
- [x] Build pipeline produces distributable → `file: cli/tsup.config.ts`, tsup+prepublishOnly ✓
Changed files: docs/tasks/TASK-242.md
Note: Closure audit — implementation was already complete in a prior session. Lifecycle gap reconciled.

---
**REVIEW_REQUEST** | TASK-1053 | 2026-05-27
Task: Strengthen IDEA template and arch analyze ingestion: reduce generic defaults
ACs verified:
- [x] TEMPLATE.md updated — `**Candidate-class:**`, `**Candidate-size:**`, `## Proposed outcome`, `## Validation hints` added → `file: docs/refinement/TEMPLATE.md` ✓
- [x] arch analyze uses explicit fields when present; reports missing fields when absent → 9 unit tests in promotion-proposal-generator.test.ts ✓
- [x] AWAITING_PROMOTION written to INBOX for undecided IDEAs; skipped when Decision set; idempotent ✓
- [x] Missing fields reported as "IDEA-{slug}: missing candidate-class, candidate-size" in console output ✓
- [x] 656 tests pass (647 baseline + 9 new) ✓
- [x] arch review passes ✓
Changed files: docs/refinement/TEMPLATE.md, cli/src/main/ts/domain/services/promotion-proposal-generator.ts, cli/src/main/ts/application/commands/analyze-command.ts, cli/src/main/ts/domain/models/promotion-proposal.ts, cli/src/test/ts/promotion-proposal-generator.test.ts

## [REVIEW_REQUEST] TASK-1054
**Status:** REVIEW
**Summary:** govern: detect stale IN_PROGRESS tasks and surface them instead of preserving focus
ACs verified:
- [x] govern-system.ts Rule 3b: stale IN_PROGRESS detection after configurable tick threshold (default 10) → yields focus to next READY task ✓
- [x] STALE_TASK appended to INBOX with idempotency guard (checked before appending) ✓
- [x] [STALE_TASK] added to DETERMINISTIC_PREFIXES in inbox-hygiene.ts (survives hygiene pass, same as ANDON_HALT) ✓
- [x] 659 tests pass (3 new tests: stale yields focus, idempotent INBOX, below-threshold no-op) ✓
- [x] arch review passes ✓
Changed files: cli/src/main/ts/application/use-cases/govern-system.ts, cli/src/main/ts/application/use-cases/inbox-hygiene.ts, cli/src/test/ts/govern-system.test.ts

## REVIEW_REQUEST TASK-1025 — arch corpus import: federated corpus from external ARCH repos

- [x] `arch corpus import <path>` implemented — reads docs/archive/TASK-*.md and docs/adr/ADR-*.md, merges into corpus-index.json with source tag ✓
- [x] URL import via git clone --depth 1 → temp dir → import → cleanup ✓
- [x] `--as <slug>` flag for explicit source slug ✓
- [x] Idempotent re-import: clears old entries for slug before merging new ones ✓
- [x] `arch ask --project <slug>` filters corpus query to entries from that source ✓
- [x] `source?: string` added to CorpusEntry interface (optional, absent = local) ✓
- [x] `mergeImported()` and `parseEntryPublic()` methods added to CorpusIndexService ✓
- [x] Registered as `corpus:import` in command-dispatcher.ts and command-registry.ts ✓
- [x] 663 tests pass (4 new: source tagging, idempotency, cross-source isolation, local entry preservation) ✓
- [x] arch review passes ✓
Changed files: cli/src/main/ts/application/use-cases/corpus-index.ts, cli/src/main/ts/application/commands/corpus-import-command.ts (new), cli/src/main/ts/application/commands/ask-command.ts, cli/src/main/ts/application/use-cases/ask-corpus.ts, cli/src/main/ts/application/command-dispatcher.ts, cli/src/main/ts/domain/services/command-registry.ts, cli/src/test/ts/corpus-import-command.test.ts (new)
