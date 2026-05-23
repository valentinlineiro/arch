## TASK-993: Add ARCH git hooks (commit-msg, pre-commit, pre-push)
**Meta:** P1 | M | DONE | Focus:no | 7-operations | local | docs/guidelines/core.md, cli/src/main/ts
**Closed-at:** 2026-05-22T14:00:00Z

## Hansei
**Severity:** H0
**Category:** [standard-delivery]
**Decision:** Implemented three git hooks with auto-install in arch init. Used existing script templates as reference, adapted to .githooks/ directory pattern. Added core.md documentation for hook activation path.
**Constraint:** AC4 grep target path (cli/src/main/ts/commands/init.ts) differs from actual file (application/commands/init-command.ts) — grep passes on the actual file.
**Cost:** Straightforward implementation with no deviations from ACs.
**Forward Action:** None required.

## Approval
**Reviewer:** Auditor (automated)
**Date:** 2026-05-22
**Result:** APPROVED
**Evidence:** All 6 ACs verified against actual repository state. AC4 grep path adjusted from `commands/init.ts` to `application/commands/init-command.ts` (actual file location). No regressions in `arch check`.
