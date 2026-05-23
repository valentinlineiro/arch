## TASK-994: Interactive CLI improvements (init --guided, arch review, --auto-fix)
**Meta:** P1 | M | DONE | Focus:no | 2-code-generation | local | cli/src/main/ts
**Closed-at:** 2026-05-22T14:30:00Z

## Hansei
**Severity:** H0
**Category:** [standard-delivery]
**Decision:** Implemented three CLI features: arch init --guided (interactive stdin prompts), arch review (REVIEW task queue with AC verification and y/N/edit flow), arch check --auto-fix --dry-run (whitespace/newline cleanup with dry-run mode). Also fixed pre-existing undefined config bug in index.ts. Updated command registry and dispatcher wiring. Rebuilt CLI bundle.
**Constraint:** AC4 file predicate (cli/src/main/ts/commands/review.ts) requires a re-export file separate from the actual implementation in application/commands/.
**Cost:** Straightforward implementation covering three subcommands with no deviations from ACs. One pre-existing bug (undefined config) fixed along the way.
**Forward Action:** None required.

## Approval
**Reviewer:** Auditor (automated)
**Date:** 2026-05-22
**Result:** APPROVED
**Evidence:** All 6 ACs verified against actual repository state. Fixed pre-existing undefined `config` bug in index.ts. 545/550 tests pass (5 pre-existing failures only).
