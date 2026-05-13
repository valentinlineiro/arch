## TASK-241: Introduce .arch/escalations.jsonl structured escalation store
**Meta:** P1 | S | IN_PROGRESS | Focus:yes | 2-code-generation | claude-code | cli/src/main/ts/application/use-cases/loop-engine.ts, cli/src/main/ts/application/commands/sandbox-command.ts, cli/src/main/ts/application/use-cases/generate-inbox.ts, docs/agents/THINK.md
**Depends:** none

### Context
ANDON_HALT and AWAITING_PROMOTION events are written only to docs/INBOX.md as prose. `arch inbox` cannot surface them. Both gate forward progress and are therefore runtime state, not audit log.

See IDEA-escalation-event-structured-store for full design, invariants, and schema. Key constraint: docs/INBOX.md must never be read by automated processes — it becomes a human-only projection artifact.

### Acceptance Criteria
- [ ] `.arch/escalations.jsonl` created with schema: escalation_id, timestamp, type, subject, reason, status (OPEN/RESOLVED), resolved_at, resolved_by
- [ ] `loop-engine.ts` appends ANDON_HALT events to escalations.jsonl (keeps INBOX.md write for audit)
- [ ] `sandbox-command.ts` appends ANDON_HALT events to escalations.jsonl
- [ ] THINK Phase 1 appends AWAITING_PROMOTION events to escalations.jsonl
- [ ] `generate-inbox.ts` reads OPEN escalations from escalations.jsonl: ANDON_HALT → urgent, AWAITING_PROMOTION → escalations section
- [ ] `docs/INBOX.md` is never read by generate-inbox.ts or any automated process
- [ ] Resolution appended as new record (status: RESOLVED) — never mutates original entry
