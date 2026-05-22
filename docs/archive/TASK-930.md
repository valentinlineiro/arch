## TASK-930: Remove machine reads of INBOX.md from loop-engine and next-command
**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | claude | cli/src/main/ts/application/use-cases/loop-engine.ts, cli/src/main/ts/application/commands/next-command.ts, docs/agents/DO.md | Closed-at: 2026-05-18T15:00:00Z

### Context

Promoted from IDEA-inbox-invariant-contradiction (TASK-927 audit, finding 1).

Human decision: INBOX is write-only for automation. Machine control signals move to `.arch/` structured state. The two code reads are bugs to remove or relocate, not exceptions to bless.

**Current violations:**
- `loop-engine.ts:350`: reads INBOX to detect `SPRINT_CHECKPOINT` markers → move signal to `.arch/escalations.jsonl` or a new `.arch/sprint-state.json`
- `next-command.ts:66`: reads INBOX to check freshness → remove or redirect to a structured source
- `docs/agents/DO.md:29`: tells an Auditor session to read INBOX → update to match invariant

**Not in scope:** The git sync policy contradiction (AGENTS.md:139 vs DO.md:7) is bundled in IDEA-inbox-invariant-contradiction but has not yet been decided. TASK-930 covers only the code reads.

### Acceptance Criteria

- [x] `loop-engine.ts` does not read `docs/INBOX.md` for any control signal. `hasSprintCheckpoint` reads from `EscalationStore.getOpenByType('SPRINT_CHECKPOINT')`; `appendSprintCheckpoint` also writes to the store.
- [x] `next-command.ts` does not read `docs/INBOX.md` for freshness. `checkInboxFreshness` removed entirely.
- [x] `docs/agents/DO.md` step 7 updated: the human reads INBOX, then starts the Auditor session; automated processes use escalations.jsonl.
- [x] Build passes. Tests for NextCommand INBOX read pass GREEN.
- [x] Sprint resumption still works via `EscalationStore` (structured store). Stale-INBOX freshness check was removed (it was itself a violation; no structured-store equivalent exists).

### Definition of Done
- [x] Tests pass (NextCommand TASK-930 test GREEN; E5 (c) stale-INBOX test removed — it tested the violation behavior itself).
- [x] Build clean.

## Hansei

**Severity:** H2
**Category:** [SpecDrift]
**Decision:** Removed two INBOX machine reads. `loop-engine.ts:hasSprintCheckpoint` now reads from `EscalationStore` (SPRINT_CHECKPOINT type added). `next-command.ts:checkInboxFreshness` removed entirely — the stale-INBOX halt was itself a violation; no structured equivalent exists. DO.md Auditor step clarified: human reads INBOX, automated processes use escalations.jsonl.
**Constraint:** The stale-INBOX freshness check is gone — agents can now pick tasks even with a stale INBOX. This was accepted: INBOX freshness was a secondary UX concern that required reading a human-only surface to enforce.
**Cost:** E5 (c) EscalationMaturity test removed — it tested the violation behavior itself, not a legitimate E5 invariant. The E5 check remains; this test scenario was wrong from the start.
**Forward Action:** IDEA-inbox-invariant-contradiction (finding 6, git sync contradiction) remains undecided. TASK-927 can now close once this review is done.
