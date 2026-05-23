## TASK-916: Cost tracking per provider : actual token counts in arch report
**Meta:** P2 | M | DONE | Focus:no | 7-operations | claude-code | cli/src/main/ts/application/commands/report-command.ts, cli/src/main/ts/domain/services/archive-parser.ts
**Closed-at:** 2026-05-17T13:23:22.332Z
**Depends:** TASK-911

## Hansei
**Severity:** H0
**Category:** [AuditGap]
**Decision:** .arch/costs/ schema documented in arch.config.json. ArchiveParser reads real cost from .arch/costs/TASK-XXX.json when present (overrides heuristic). MetricsEngine extended with computeHanseiBreakdown and computeActorBreakdown. costPerTask now tracks realCount and heuristicCount separately. ReportCommand shows real vs heuristic split.
**Constraint:** actorBreakdown requires >=5 actor-tagged tasks — returns empty until corpus grows.
**Cost:** No architectural debt introduced.
**Forward Action:** None required.

## Approval
Approved-by: Auditor | 2026-05-17
