## TASK-198: [BUG] govern archive guard logs Hansei violations but does not escalate blocked DONE tasks
**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/application/use-cases/govern-system.ts, docs/agents/DO.md, docs/INBOX.md
**Closed-at:** 2026-05-05T11:47:37.581Z
**Depends:** none

### Context
`GovernSystem` now blocks archiving post-rollout DONE tasks without `## Hansei`, but it only logs the failure and continues. In autonomous operation this leaves a DONE task stranded in `docs/tasks/` without an INBOX signal or halt path, so the coordination layer never reflects the archive guard failure.

### Acceptance Criteria
- [x] When govern blocks auto-archive due to missing Hansei, it appends a typed escalation entry to `docs/INBOX.md` with task ID and evidence
- [x] Govern treats the blocked archive as a real halt/escalation condition rather than a silent log-only failure
- [x] Tests cover both direct auto-archive and phantom-archive sync failure paths
- [x] `npm test` passes in `cli/`

### Definition of Done
- [x] All ACs checked.
- [x] `arch review` passes.
- [x] `npm test` passes in `cli/`.

## Hansei
Integrating escalation directly into the governance tick ensures that archival failures (like missing Hansei) are caught immediately and surfaced to the human via INBOX. Surfaces the "hidden" failures that occur between implementation and archival.
