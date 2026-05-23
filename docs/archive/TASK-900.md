## TASK-900: Replace INBOX.md approval-gate reads with .arch/approvals.jsonl
**Meta:** P1 | S | DONE | Focus:no | 1-code-reasoning | claude-code | cli/src/main/ts/application/commands/sandbox-command.ts, cli/src/main/ts/application/use-cases/loop-engine.ts, cli/src/main/ts/infrastructure/filesystem/escalation-store.ts
**Closed-at:** 2026-05-16T22:03:51.123Z
**Depends:** none

## Hansei
**Severity:** H1
**Category:** [SpecDrift]
**Decision:** Both INBOX.md reads replaced with structured escalation store reads. arch approve command added for human-facing approval. sandbox-command now reads .arch/escalations.jsonl for APPROVED entries. loop-engine handleResume reads ANDON_HALT/APPROVED/REDIRECT from store.
**Constraint:** Sprint checkpoint detection (SPRINT_CHECKPOINT in INBOX) was removed from handleResume — it depended on INBOX.md. Sprint flow now relies on escalation store for all resume signals.
**Cost:** Existing loops that used APPROVE/REDIRECT inline in INBOX.md will not be recognized. Operators must use arch approve going forward.
**Forward Action:** Document arch approve in AGENTS.md and ARCH-CORE.md.

## Approval
Approved-by: Auditor | 2026-05-16
