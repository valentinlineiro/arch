# INBOX
_Generated: 2026-05-27 by [THINK] session_

## Loop Status
- IN_PROGRESS: 11 (TASK-1016, 1017, 1019, 1020, 1021, 1022, 1023, 1048, 1050, 1052, 1058)
- REVIEW: 0
- READY: 18
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
1. TASK-1057 — arch init: seed sprint-state.json on first run (P3/S)
2. TASK-1034 — standardize CLI output strategy: one path (P2/S)
3. TASK-1054 — govern: detect stale IN_PROGRESS tasks (P2/S)
4. TASK-1025 — arch corpus import: federated corpus from external repos (P2/S)
5. TASK-1053 — strengthen IDEA template + arch analyze ingestion (P1/M)

## Pending REVIEW_REQUESTS
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
Changed files: docs/refinement/TEMPLATE.md, cli/src/main/ts/application/services/promotion-proposal-generator.ts, cli/src/main/ts/application/commands/analyze-command.ts, cli/src/main/ts/domain/models/promotion-proposal.ts, cli/src/test/ts/promotion-proposal-generator.test.ts
