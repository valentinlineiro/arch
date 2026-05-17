# IDEA: Cost tracking per provider — actual token counts in arch report
**Created:** 2026-05-17
**Source:** Session observation — arch report cost column is heuristic, not real
**Status:** DRAFT
**Sessions:** 0
**Meta:** P2 | M | 7-operations | arch.config.json, cli/src/main/ts/domain/services/archive-parser.ts, cli/src/main/ts/application/use-cases/

## Problem

`arch report` shows "Avg Cost: $0.13 (heuristic v1)" — a rough approximation based on task size, not actual token usage. The routing strategies in `arch.config.json` are designed to minimize cost but there's no feedback loop: you don't know if routing Ollama to XS tasks is actually cheaper than Claude Haiku, or whether your M tasks on claude-code/sonnet are within budget.

The `Actor` field (IDEA-session-identity) would provide the model. But the token counts are never captured.

## Proposed Solution

**Token count file:** after each `arch exec` session, the CLI bridge writes a `.arch/costs/<TASK-ID>.json` with:
```json
{ "taskId": "TASK-XXX", "actor": "claude-code/sonnet", "inputTokens": 12400, "outputTokens": 3200, "estimatedCostUSD": 0.048 }
```
Written by `arch exec` post-run, not during (to avoid blocking execution on cost tracking).

**`arch report` extension:** reads `.arch/costs/*.json`, aggregates by actor and class:
```
Cost by Provider (last 20 tasks):
  claude-code/sonnet    M    $0.12 avg   18 tasks
  ollama/qwen2.5-coder  XS   $0.00 avg   4 tasks
  gemini/pro            L    $0.31 avg   2 tasks
```

**Token count source:** Claude Code outputs token usage in its exit metadata. Gemini CLI similarly. Local models are $0.00 by definition.

## Constraint Axes
- Dependency ordering: Depends on IDEA-session-identity (Actor field) for meaningful breakdown
- Temporal validity: Valid now; signal requires `arch exec` usage
- Abstraction layer: Correct — telemetry and reporting only
- Observability validity: Depends on CLI bridge cooperation — partially deterministic
- Priority displacement: P2

## Decision
<!-- PROMOTE → TASK-XXX | REJECT: reason | DEFERRED: reason + condition -->
