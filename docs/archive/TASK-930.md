## TASK-930: Remove machine reads of INBOX.md from loop-engine and next-command
**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | claude | cli/src/main/ts/application/use-cases/loop-engine.ts, cli/src/main/ts/application/commands/next-command.ts, docs/agents/DO.md | Closed-at: 2026-05-18T15:00:00Z

## Hansei

**Severity:** H2
**Category:** [SpecDrift]
**Decision:** Removed two INBOX machine reads. `loop-engine.ts:hasSprintCheckpoint` now reads from `EscalationStore` (SPRINT_CHECKPOINT type added). `next-command.ts:checkInboxFreshness` removed entirely — the stale-INBOX halt was itself a violation; no structured equivalent exists. DO.md Auditor step clarified: human reads INBOX, automated processes use escalations.jsonl.
**Constraint:** The stale-INBOX freshness check is gone — agents can now pick tasks even with a stale INBOX. This was accepted: INBOX freshness was a secondary UX concern that required reading a human-only surface to enforce.
**Cost:** E5 (c) EscalationMaturity test removed — it tested the violation behavior itself, not a legitimate E5 invariant. The E5 check remains; this test scenario was wrong from the start.
**Forward Action:** IDEA-inbox-invariant-contradiction (finding 6, git sync contradiction) remains undecided. TASK-927 can now close once this review is done.
