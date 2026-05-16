## TASK-906: arch inbox --resurrect: surface TTL-rejected IDEAs for re-evaluation
**Meta:** P2 | S | IN_PROGRESS | Focus:yes | 2-code-generation | claude-code | cli/src/main/ts/application/commands/inbox-command.ts, cli/src/main/ts/application/use-cases/generate-inbox.ts

**Depends:** none

### Context

TTL-rejection is not a human decision — it is a timeout. IDEAs archived as `REJECT: TTL expired` may be valid ideas whose context changed (system matured, related task closed, problem resurfaced). There is no mechanism to surface them for re-evaluation. `arch inbox --decisions` (TASK-893) established the pattern; this task adds `--resurrect`.

### Acceptance Criteria

- [ ] `GenerateInbox.getResurrectQueue()` added: reads `docs/refinement/archive/IDEA-*.md`, filters for Status `REJECTED` with Decision containing `TTL expired` or Status `DEFERRED`. Returns array sorted by created date ascending (oldest first), each entry: `slug`, `title`, `problem` (first 100 chars), `created`, `sessions`.
  - `file: cli/src/main/ts/application/use-cases/generate-inbox.ts`

- [ ] `arch inbox --resurrect` subcommand renders the resurrection queue. Each entry shows slug, title, one-line problem, created date, sessions. Prints "No TTL-rejected IDEAs in archive." when queue is empty.
  - `cmd: node cli/dist/index.js inbox --resurrect`

- [ ] THINK Phase 3 doc updated: every 20 govern ticks (or when READY count < 3 and archive > 10 TTL-rejected), emit `[RESURRECTION-REVIEW] N TTL-rejected IDEAs — run arch inbox --resurrect` to `docs/INBOX.md`. Non-blocking.
  - `file: docs/agents/THINK.md`

- [ ] `arch review` passes.
  - `cmd: node cli/dist/index.js review`

- [ ] `npm test` passes.
  - `cmd: npm test`

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
