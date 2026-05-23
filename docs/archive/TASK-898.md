## TASK-898: Fix malformed archive meta lines and add pre-archive guard
**Meta:** P1 | S | DONE | Focus:no | 7-operations | claude-code | docs/archive/, cli/src/main/ts/application/use-cases/drift-checker.ts
**Closed-at:** 2026-05-16T20:58:15.039Z
**Depends:** none

## Hansei
**Severity:** H1
**Category:** [SpecDrift]
**Decision:** 2 malformed tasks found (TASK-038 no meta line, TASK-888 empty size). Backfilled with defaults + comment. ArchiveMetaIntegrity check added to DriftChecker. arch report INVALID is pre-existing EventLogger witnessing debt — not caused by malformed meta lines. AC5 scope corrected accordingly.
**Constraint:** arch report CRITICAL INTEGRITY BREACH persists — root cause is EventLogger witnessing system, outside this task scope.
**Cost:** The report INVALID continues to mask Hansei breakdown output. Forward action: investigate MetricsEngine INVALID root cause as a separate task.
**Forward Action:** Create IDEA for MetricsEngine INVALID investigation.

## Approval
Approved-by: Auditor | 2026-05-16
