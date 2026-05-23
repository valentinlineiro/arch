## TASK-257: Lightweight trusted-metrics refresh on task closure and govern ticks
**Meta:** P1 | M | DONE | Focus:no | 2-code-generation | claude | cli/src/main/ts/application/use-cases/mark-task-done.ts, cli/src/main/ts/application/use-cases/govern-system.ts, cli/src/main/ts/application/commands/report-command.ts, docs/METRICS.md
**Closed-at:** 2026-05-15T00:00:00Z

## Hansei
**Severity:** H0
**Category:** [SpecDrift]

**Decision:** Implementation scope matches spec exactly — Completed Tasks (archive count) and REVIEW_FAIL Rate only. Cycle Time excluded per the task's Decisions section. Both mark-task-done and govern-system trigger refresh non-fatally. Dynamic import used to avoid circular dependency at module load time.

**Constraint:** LightweightMetricsRefresh uses regex replacement on raw METRICS.md content. If the Trusted Metrics table format changes (e.g. column order, row wording), the regex will fail silently and return unchanged content. The table format is stable and matches report-command.ts output.

**Cost:** Two update paths for METRICS.md (lightweight + full arch report) must maintain consistent row formatting. Divergence would cause the lightweight refresh to silently no-op. Current format is shared by inspection — not enforced by a shared constant.

**Forward Action:** If METRICS.md row format ever changes, update the regex in lightweight-metrics-refresh.ts in the same commit. No separate tracking required while the format remains stable.

## Approval
Approved-by: Auditor | 2026-05-15
