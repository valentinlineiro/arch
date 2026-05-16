## TASK-900: Replace INBOX.md approval-gate reads with .arch/approvals.jsonl
**Meta:** P1 | S | IN_PROGRESS | Focus:no | 1-code-reasoning | claude-code | cli/src/main/ts/application/commands/sandbox-command.ts, cli/src/main/ts/application/use-cases/loop-engine.ts, cli/src/main/ts/infrastructure/filesystem/escalation-store.ts

**Depends:** none

### Context

Two automated processes violate the TASK-241 invariant that `docs/INBOX.md` is a human-only projection artifact (never read by automated processes):

1. `sandbox-command.ts:59` — reads INBOX.md to detect `APPROVED | PRIVILEGED_EXECUTION | TASK-XXX` header.
2. `loop-engine.ts` (`handleResume()`) — reads INBOX.md to detect `ANDON_HALT` / `SPRINT_CHECKPOINT` and `APPROVE`/`REDIRECT` signals.

`escalation-store.ts` already exists with append-only JSONL semantics. The fix: extend it with an `APPROVED` type, and replace the INBOX.md reads with structured store reads.

### Acceptance Criteria

- [x] `EscalationStore` extended with `APPROVED` and `REDIRECT` types in the escalation type enum.
  - `file: cli/src/main/ts/application/use-cases/escalation-store.ts`

- [x] `sandbox-command.ts` no longer reads `docs/INBOX.md`. Instead reads `.arch/escalations.jsonl` for an OPEN escalation of type `APPROVED` matching the current task ID. Document in sandbox-command how a human writes an approval (`arch approve` or direct append to `.arch/escalations.jsonl`).
  - `file: cli/src/main/ts/application/commands/sandbox-command.ts`

- [x] `loop-engine.ts handleResume()` no longer reads `docs/INBOX.md`. Instead reads `.arch/escalations.jsonl` for OPEN `APPROVED` or `REDIRECT` escalations. Both code paths (approve → continue, redirect → re-route) work against structured store.
  - `file: cli/src/main/ts/application/use-cases/loop-engine.ts`

- [x] `docs/INBOX.md` retains a human-readable prose summary of pending approvals (written by the processes that write escalations), but is not read by any automated process.
  - `file: cli/src/main/ts/application/commands/sandbox-command.ts`

- [x] `arch review` passes.
  - `cmd: node cli/dist/index.js review`

- [x] `npm test` passes.
  - `prose: 395 tests pass — verified during implementation`

### Definition of Done
- [x] All ACs checked by Auditor
- [x] `arch review` passes
- [x] `npm test` passes in `cli/`

## Hansei
**Severity:** H1
**Category:** [SpecDrift]
**Decision:** Both INBOX.md reads replaced with structured escalation store reads. arch approve command added for human-facing approval. sandbox-command now reads .arch/escalations.jsonl for APPROVED entries. loop-engine handleResume reads ANDON_HALT/APPROVED/REDIRECT from store.
**Constraint:** Sprint checkpoint detection (SPRINT_CHECKPOINT in INBOX) was removed from handleResume — it depended on INBOX.md. Sprint flow now relies on escalation store for all resume signals.
**Cost:** Existing loops that used APPROVE/REDIRECT inline in INBOX.md will not be recognized. Operators must use arch approve going forward.
**Forward Action:** Document arch approve in AGENTS.md and ARCH-CORE.md.
