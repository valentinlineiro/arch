## TASK-181: Add dependency graph validation to arch review
**Meta:** P2 | S | DONE | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/domain/services/drift-checker.ts, cli/src/main/ts/application/use-cases/review-system.ts
**Closed-at:** 2026-05-05T09:14:29.341Z
**Depends:** none

## Approval
Approved-by: Auditor | 2026-05-05

## Hansei
Task is S-sized but touched 3 files (source, test, dist rebuild). The rebuild step is manual — a pre-commit hook that auto-rebuilds on drift-checker changes would close that gap.
