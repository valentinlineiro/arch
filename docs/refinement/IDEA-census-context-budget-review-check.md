# IDEA: Add context budget (CENSUS) check to arch review
**Created:** 2026-04-30
**Source:** Human proposal (CENSUS protocol) — ADR-002 names context-as-budget but enforces nothing
**Status:** DRAFT
**Meta:** P2 | M | local | cli/src/, arch.config.json, docs/guidelines/documentation.md

## Problem
ADR-002 establishes "Context-as-a-Budget" as a core principle but there is no enforcement mechanism. As `docs/tasks/`, `docs/refinement/`, and `cli/src/` grow, the repository can silently exceed what an LLM can reason about in a single context window. By the time this becomes a problem, the fix is a large refactor.

## Proposed solution
Add a `contextBudget` block to `arch.config.json` with per-directory line-count thresholds (line count is a deterministic proxy for token weight):

```json
"contextBudget": {
  "docs/tasks": 2000,
  "docs/refinement": 1500,
  "cli/src": 5000
}
```

Add a new `arch review` check (`Census`) that counts lines per directory and emits a WARN when a threshold is exceeded. The WARN message should propose a specific PURGE or REFACTOR task into the backlog (e.g. "docs/tasks exceeds 2000 lines — consider archiving completed tasks or splitting the directory").

## Dependencies
None — extends existing `arch review` infrastructure.

## Estimated size
M

## Gaps

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
