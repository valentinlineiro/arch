## TASK-198: [BUG] govern archive guard logs Hansei violations but does not escalate blocked DONE tasks
**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/application/use-cases/govern-system.ts, docs/agents/DO.md, docs/INBOX.md
**Closed-at:** 2026-05-05T11:47:37.581Z
**Depends:** none

## Hansei
Integrating escalation directly into the governance tick ensures that archival failures (like missing Hansei) are caught immediately and surfaced to the human via INBOX. Surfaces the "hidden" failures that occur between implementation and archival.
