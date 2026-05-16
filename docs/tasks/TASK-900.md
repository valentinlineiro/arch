## TASK-900: Replace INBOX.md approval-gate reads with .arch/approvals.jsonl
**Meta:** P1 | S | READY | Focus:no | 1-code-reasoning | claude-code | cli/src/main/ts/application/commands/sandbox-command.ts, cli/src/main/ts/application/use-cases/loop-engine.ts, cli/src/main/ts/infrastructure/filesystem/escalation-store.ts

**Depends:** none

### Context

Two automated processes violate the TASK-241 invariant that `docs/INBOX.md` is a human-only projection artifact (never read by automated processes):

1. `sandbox-command.ts:59` — reads INBOX.md to detect `APPROVED | PRIVILEGED_EXECUTION | TASK-XXX` header.
2. `loop-engine.ts` (`handleResume()`) — reads INBOX.md to detect `ANDON_HALT` / `SPRINT_CHECKPOINT` and `APPROVE`/`REDIRECT` signals.

`escalation-store.ts` already exists with append-only JSONL semantics. The fix: extend it with an `APPROVED` type, and replace the INBOX.md reads with structured store reads.

### Acceptance Criteria

- [ ] `EscalationStore` extended with `APPROVED` and `REDIRECT` types in the escalation type enum.
  - `file: cli/src/main/ts/infrastructure/filesystem/escalation-store.ts`

- [ ] `sandbox-command.ts` no longer reads `docs/INBOX.md`. Instead reads `.arch/escalations.jsonl` for an OPEN escalation of type `APPROVED` matching the current task ID. Document in sandbox-command how a human writes an approval (`arch approve` or direct append to `.arch/escalations.jsonl`).
  - `file: cli/src/main/ts/application/commands/sandbox-command.ts`

- [ ] `loop-engine.ts handleResume()` no longer reads `docs/INBOX.md`. Instead reads `.arch/escalations.jsonl` for OPEN `APPROVED` or `REDIRECT` escalations. Both code paths (approve → continue, redirect → re-route) work against structured store.
  - `file: cli/src/main/ts/application/use-cases/loop-engine.ts`

- [ ] `docs/INBOX.md` retains a human-readable prose summary of pending approvals (written by the processes that write escalations), but is not read by any automated process.
  - `file: cli/src/main/ts/application/commands/sandbox-command.ts`

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
