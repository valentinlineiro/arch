## TASK-974: Command registry as single source of truth for CLI surface
**Meta:** P1 | M | DONE | Focus:no | 2-code-generation | human | cli/src/main/ts/
**Closed-at:** 2026-05-20T12:46:07Z

## Hansei

**Severity:** H1
**Category:** [SpecDrift]
**Decision:** Implemented delta/full/hybrid scope separation in review-system.ts and review-command.ts. Pre-push hook now runs --staged (delta) by default. Global checks (OrphanTasks, FocusStatusAlignment, SentinelCoverage, DeadContext, etc.) are excluded from delta scope and only run in full/hybrid mode.
**Constraint:** Registry must be kept manually aligned with index.ts switch-case. Scope defaults to hybrid; explicit --staged required for delta mode. Global checks fire on FAIL regardless of scope in hybrid/full.
**Cost:** Reduced pre-push hook noise. Global health now requires explicit --full run. False positives from historical state eliminated.
**Forward Action:** Address the Focus/IN_PROGRESS incoherence separately — it's a model-level decision not a review implementation issue.

## Approval
Approved-by: human-auditor | 2026-05-20
