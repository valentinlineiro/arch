## TASK-189: Add executable AC predicates to task format and DO close step
**Meta:** P0 | M | DONE | Focus:no | 2-code-generation | claude-code | docs/TASK-FORMAT.md, docs/agents/DO.md, cli/src/main/ts/
**Closed-at:** 2026-05-05T09:39:16.503Z
**Depends:** none

## Hansei
The `arch task review` predicate enforcement only runs when the agent explicitly calls the command — a human or agent editing the Meta line directly can still bypass it. A pre-commit hook checking pending `cmd:` predicates would close this gap without requiring discipline from the caller.
