## TASK-198: [BUG] govern archive guard logs Hansei violations but does not escalate blocked DONE tasks
**Meta:** P1 | S | READY | Focus:yes | 2-code-generation | claude-code | cli/src/main/ts/application/use-cases/govern-system.ts, docs/agents/DO.md, docs/INBOX.md
**Depends:** none

### Context
`GovernSystem` now blocks archiving post-rollout DONE tasks without `## Hansei`, but it only logs the failure and continues. In autonomous operation this leaves a DONE task stranded in `docs/tasks/` without an INBOX signal or halt path, so the coordination layer never reflects the archive guard failure.

### Acceptance Criteria
- [ ] When govern blocks auto-archive due to missing Hansei, it appends a typed escalation entry to `docs/INBOX.md` with task ID and evidence
- [ ] Govern treats the blocked archive as a real halt/escalation condition rather than a silent log-only failure
- [ ] Tests cover both direct auto-archive and phantom-archive sync failure paths
- [ ] `npm test` passes in `cli/`

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
- [ ] `npm test` passes in `cli/`.
