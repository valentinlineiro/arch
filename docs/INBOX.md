# ARCH INBOX

## Loop Status
- **Active Tasks:** 2 (TASK-919, TASK-950)
- **READY Tasks:** 45

## Pending Items
- **AWAITING_REVIEW:** 
  - TASK-948
  - TASK-949
- **AWAITING_PROMOTION:**
  - IDEA-temporal-pattern-layer

## Refinement Queue
- archive-parser-skip-non-done
- automate-turn-count
- cli-architecture-drift-review
- deterministic-governance-gates
- fix-class-boundary-violation-excision
- fix-commit-exception-contradiction
- fix-decomposition-duplication
- fix-governance-terminology-collision
- guided-close-path
- status-doc-refresh
- temporal-pattern-layer

## Recently Completed
- TASK-252: Introduce size-tiered closure and review obligations
- TASK-946: 1.0.0 release: fix reflect modePreamble bug, collapse context feedback, Metrics Narrowing, version bump
- TASK-945: replace bash scripts/arch.sh references with arch CLI binary
- TASK-944: collapse arch.sh routing layer into CLI - move AC pre-check
- TASK-943: fix arch.sh help and task-command help misalignment with can
## [AWAITING_REVIEW] TASK-948 [L3-AUTO]
**Closed:** 2026-05-19T08:13:09.097Z
**Title:** Enhance CLI UX with interactivity and local dashboard

| AC | Type | Pass | Detail |
|---|---|---|---|
| Expose `arch status` command for quick sprint progress overv | unknown | ✔ | no predicate declared — treated as prose |
| Make `arch task start` interactive in TTY mode when no ID is | unknown | ✔ | no predicate declared — treated as prose |
| Implement `arch govern serve` to launch a local dashboard se | unknown | ✔ | no predicate declared — treated as prose |
| Update `arch-viewer.html` to fetch from local API when on lo | unknown | ✔ | no predicate declared — treated as prose |
| Improve main help output with categorized commands. | unknown | ✔ | no predicate declared — treated as prose |
| `arch review` passes | cmd | ✔ | exit 0 (expected 0) |

## [2026-05-19] REVIEW_REQUEST | TASK-253 | Wire causal graph ingestion into task completion flow
**Status:** REVIEW
**Changed files:** cli/src/main/ts/application/use-cases/mark-task-done.ts, cli/src/main/ts/application/use-cases/validate-task-acs.ts, cli/src/test/ts/mark-task-done.test.ts
**ACs:**
- implements signal for ADR references (grep: verified)
- caused_by signal for Depends field entries (prose: verified by code)
- category signal from Hansei block (prose: verified by code)
- source:system + confidence:0.5 schema compatibility (grep: verified in causal-signal.jsonl)
- causal-arbitrator unchanged — no source-specific branching (prose)
- no-op guard for empty context + no depends (prose)
- signal emission ordering: after task save (prose)
- CLI tests: 3 new tests covering ADR emission, Depends emission, no-op (cmd: npm test passed)
- arch review: passed

## [2026-05-19] REVIEW_PASS | TASK-253
All 9 ACs verified. arch review passes. Archived to docs/archive/TASK-253.md.
