## TASK-916: Cost tracking per provider : actual token counts in arch report
**Meta:** P2 | M | READY | Focus:no | 7-operations | claude-code | cli/src/main/ts/application/commands/report-command.ts, cli/src/main/ts/domain/services/archive-parser.ts

**Depends:** TASK-911

### Context

`arch report` cost column is heuristic : rough approximation based on task size, not actual token usage. With Actor field (TASK-911) providing model identity, token counts per session can produce meaningful per-provider cost breakdowns. Source: `.arch/costs/<TASK-ID>.json` written by `arch exec` post-run.

### Acceptance Criteria

- [ ] `.arch/costs/` directory schema documented in `arch.config.json` (or AGENTS.md): after each `arch exec` session the bridge writes `.arch/costs/TASK-XXX.json` with `{ taskId, actor, inputTokens, outputTokens, estimatedCostUSD }`. `arch exec` is out of scope for this task : document the schema only.
  - `file: docs/AGENTS.md`

- [ ] `ArchiveParser` reads `.arch/costs/TASK-XXX.json` when parsing archived tasks. Merges `estimatedCostUSD` into `ArchivedTaskMetrics.cost` (overrides heuristic when real data exists).
  - `file: cli/src/main/ts/domain/services/archive-parser.ts`

- [ ] `arch report` extended: when Actor data (from TASK-911) is present in ≥5 tasks, adds `Cost by Actor` table:
  ```
  Cost by Actor (last 20 tasks):
    claude-code/sonnet    M    $0.12 avg   18 tasks
    ollama/qwen2.5-coder  XS   $0.00 avg    4 tasks
  ```
  Falls back to current heuristic when cost data absent.
  - `file: cli/src/main/ts/application/commands/report-command.ts`

- [ ] `MetricsEngine` updated: when `cost` field has real data (not heuristic), exclude it from heuristic averaging : report both separately.
  - `file: cli/src/main/ts/domain/services/metrics-engine.ts`

- [ ] `arch review` passes.
  - `cmd: node cli/dist/index.js review`

- [ ] `npm test` passes.
  - `prose: verified during implementation`

### Definition of Done
- [ ] All ACs checked by Auditor
- [ ] `arch review` passes
- [ ] `npm test` passes in `cli/`

## Hansei
**Severity:** H0
**Category:** [no-issue]
**Decision:** Not yet started.
**Constraint:** None.
**Cost:** None.
**Forward Action:** None.
