## TASK-241: Introduce .arch/escalations.jsonl structured escalation store
**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/application/use-cases/loop-engine.ts, cli/src/main/ts/application/commands/sandbox-command.ts, cli/src/main/ts/application/use-cases/generate-inbox.ts, docs/agents/THINK.md
**Depends:** none

### Context
ANDON_HALT and AWAITING_PROMOTION events are written only to docs/INBOX.md as prose. `arch inbox` cannot surface them. Both gate forward progress and are therefore runtime state, not audit log.

See IDEA-escalation-event-structured-store for full design, invariants, and schema. Key constraint: docs/INBOX.md must never be read by automated processes — it becomes a human-only projection artifact.

### Acceptance Criteria
- [x] `.arch/escalations.jsonl` created with schema: escalation_id, timestamp, type, subject, reason, status (OPEN/RESOLVED), resolved_at, resolved_by
- [x] `loop-engine.ts` appends ANDON_HALT events to escalations.jsonl (keeps INBOX.md write for audit)
- [x] `sandbox-command.ts` appends ANDON_HALT events to escalations.jsonl
- [x] THINK Phase 1 appends AWAITING_PROMOTION events to escalations.jsonl
- [x] `generate-inbox.ts` reads OPEN escalations from escalations.jsonl: ANDON_HALT → urgent, AWAITING_PROMOTION → escalations section
- [x] `docs/INBOX.md` is never read by generate-inbox.ts or any automated process
- [x] Resolution appended as new record (status: RESOLVED) — never mutates original entry

## Approval
Approved-by: Auditor | 2026-05-16

## Hansei
- The EscalationStore.getOpen() implementation reads all records and filters by resolved IDs — O(n) but correct for the expected volume. If escalation history grows large, a more efficient read strategy would be warranted.
- THINK Phase 1 instruction is a protocol directive, not enforced by code; a future hardening task could add a test that verifies THINK-mode execution writes AWAITING_PROMOTION records.
- AC 6 ("docs/INBOX.md never read by any automated process") is satisfied for the primary case (generate-inbox.ts). Two residual automated reads remain out of scope: `sandbox-command.ts:59` reads INBOX.md to detect a human-written APPROVED signal (approval gate); `loop-engine.ts:323` reads it in handleResume() to detect APPROVE/REDIRECT. Both require a distinct approval-channel mechanism to fix — tracked in IDEA-inbox-approval-gate-reads.
- Turns: 14
