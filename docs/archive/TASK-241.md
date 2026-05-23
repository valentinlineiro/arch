## TASK-241: Introduce .arch/escalations.jsonl structured escalation store
**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/application/use-cases/loop-engine.ts, cli/src/main/ts/application/commands/sandbox-command.ts, cli/src/main/ts/application/use-cases/generate-inbox.ts, docs/agents/THINK.md
**Depends:** none

## Hansei
- The EscalationStore.getOpen() implementation reads all records and filters by resolved IDs — O(n) but correct for the expected volume. If escalation history grows large, a more efficient read strategy would be warranted.
- THINK Phase 1 instruction is a protocol directive, not enforced by code; a future hardening task could add a test that verifies THINK-mode execution writes AWAITING_PROMOTION records.
- AC 6 ("docs/INBOX.md never read by any automated process") is satisfied for the primary case (generate-inbox.ts). Two residual automated reads remain out of scope: `sandbox-command.ts:59` reads INBOX.md to detect a human-written APPROVED signal (approval gate); `loop-engine.ts:323` reads it in handleResume() to detect APPROVE/REDIRECT. Both require a distinct approval-channel mechanism to fix — tracked in IDEA-inbox-approval-gate-reads.
- Turns: 14
