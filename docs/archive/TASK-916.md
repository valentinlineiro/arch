## TASK-916: Cost tracking per provider : actual token counts in arch report
**Meta:** P2 | M | DONE | Focus:no | 7-operations | claude-code | cli/src/main/ts/application/commands/report-command.ts, cli/src/main/ts/domain/services/archive-parser.ts
**Closed-at:** 2026-05-17T13:23:22.332Z

**Depends:** TASK-911

### Context

`arch report` cost column is heuristic : rough approximation based on task size, not actual token usage. With Actor field (TASK-911) providing model identity, token counts per session can produce meaningful per-provider cost breakdowns. Source: `.arch/costs/<TASK-ID>.json` written by `arch exec` post-run.

### Acceptance Criteria

- [x] `.arch/costs/` directory schema documented in `arch.config.json` (or AGENTS.md): after each `arch exec` session the bridge writes `.arch/costs/TASK-XXX.json` with `{ taskId, actor, inputTokens, outputTokens, estimatedCostUSD }`. `arch exec` is out of scope for this task : document the schema only.
  - `file: docs/AGENTS.md`

- [x] `ArchiveParser` reads `.arch/costs/TASK-XXX.json` when parsing archived tasks. Merges `estimatedCostUSD` into `ArchivedTaskMetrics.cost` (overrides heuristic when real data exists).
  - `file: cli/src/main/ts/domain/services/archive-parser.ts`

- [x] `arch report` extended: when Actor data (from TASK-911) is present in ≥5 tasks, adds `Cost by Actor` table:
  ```
  Cost by Actor (last 20 tasks):
    claude-code/sonnet    M    $0.12 avg   18 tasks
    ollama/qwen2.5-coder  XS   $0.00 avg    4 tasks
  ```
  Falls back to current heuristic when cost data absent.
  - `file: cli/src/main/ts/application/commands/report-command.ts`

- [x] `MetricsEngine` updated: when `cost` field has real data (not heuristic), exclude it from heuristic averaging : report both separately.
  - `file: cli/src/main/ts/domain/services/metrics-engine.ts`

- [x] `arch review` passes.
  - `prose: arch review OK — verified during implementation`

- [x] `npm test` passes.
  - `prose: verified during implementation`

### Definition of Done
- [x] All ACs checked by Auditor
- [x] `arch review` passes
- [x] `npm test` passes in `cli/`

## Hansei
**Severity:** H0
**Category:** [AuditGap]
**Decision:** .arch/costs/ schema documented in arch.config.json. ArchiveParser reads real cost from .arch/costs/TASK-XXX.json when present (overrides heuristic). MetricsEngine extended with computeHanseiBreakdown and computeActorBreakdown. costPerTask now tracks realCount and heuristicCount separately. ReportCommand shows real vs heuristic split.
**Constraint:** actorBreakdown requires >=5 actor-tagged tasks — returns empty until corpus grows.
**Cost:** No architectural debt introduced.
**Forward Action:** None required.

## Approval
Approved-by: Auditor | 2026-05-17
