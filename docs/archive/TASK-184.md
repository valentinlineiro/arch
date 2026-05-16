## TASK-184: Add Census (context budget) check to arch review
**Meta:** P2 | M | DONE | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/domain/services/drift-checker.ts, arch.config.json
**Closed-at:** 2026-05-05T09:17:15.820Z
**Depends:** none

## Approval
Approved-by: Auditor | 2026-05-05

## Hansei
The Census check counts only top-level files (subdirectories are silently skipped) — a `docs/refinement/archive/` subtree could grow unbounded without triggering the budget. Counting recursively or adding a separate budget entry per subdirectory would close this gap.
