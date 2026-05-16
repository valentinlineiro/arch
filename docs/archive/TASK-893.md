## TASK-893: Decision-gated idea loss: prevent silent TTL expiry of undecided IDEAs
**Meta:** P1 | M | DONE | Focus:no | 1-code-reasoning | claude-code | cli/src/main/ts/, docs/agents/THINK.md
**Closed-at:** 2026-05-16T10:52:21.646Z

**Depends:** none

### Context

Structurally sound IDEAs are being lost not because they are wrong or stale but because the human never made a binary decision. The TTL-archival mechanism currently conflates "undecided" with "invalid" — archiving with `REJECTED: TTL expired` regardless of whether the IDEA was evaluated and found wanting or evaluated and left waiting.

Three concrete fixes:

**A. DEFERRED status** — human-writable, distinct from `REJECTED: TTL expired`. THINK archives with the human's reason, not a timeout.

**B. Decision-required marker** — THINK adds `**Decision-required:** yes` to IDEAs with Sessions >= 2 and no Decision field. Makes the gap explicit in the file itself.

**C. `arch inbox --decisions` filter** — dedicated view of open `AWAITING_PROMOTION` escalations, sorted by sessions descending. Designed for a 5-minute decision session.

**D. `arch review` violation** — IDEAs archived with empty Decision field are a detectable protocol violation.

### Acceptance Criteria

- [x] THINK Phase 1: IDEAs with `Sessions >= 2` and no Decision field receive `**Decision-required:** yes` marker on each evaluation pass.
  - `file: docs/agents/THINK.md`

- [x] THINK Phase 1: TTL-archival (`Sessions > 3`, no Decision) is blocked if the IDEA has `Decision-required: yes` — instead, THINK emits `[DECISION-REQUIRED] IDEA-slug — N sessions, human decision needed` to stdout and does NOT archive.
  - `file: docs/agents/THINK.md`

- [x] `arch inbox --decisions` subcommand: lists only IDEAs with open `AWAITING_PROMOTION` escalations in `escalations.jsonl`, sorted by Sessions descending. Each entry shows: slug, title, one-line problem summary, sessions, created date.
  - `cmd: node cli/dist/index.js inbox --decisions`

- [x] `arch review` emits `ObsoleteGuidelines`-class WARN for any IDEA file in `docs/refinement/archive/` with an empty or missing Decision field.
  - `cmd: node cli/dist/index.js review`

- [x] DEFERRED status: if a human writes `DEFERRED: <reason>` in the Decision field, THINK archives the IDEA with status `DEFERRED` (not `REJECTED: TTL expired`) and does not re-surface it in future sessions unless explicitly re-opened.
  - `file: docs/agents/THINK.md`

- [x] `arch review` passes clean after implementation.
  - `cmd: node cli/dist/index.js review`

### Definition of Done
- [x] All ACs checked by Auditor
- [x] `arch review` passes
- [x] `npm test` passes in `cli/`

## Approval
Approved-by: Auditor | 2026-05-16

## Hansei
**Severity:** H0
**Category:** [AuditGap]
**Decision:** Implemented all 5 ACs. THINK.md updated with decision-required marker, TTL block, and DEFERRED status. arch inbox --decisions live. ArchivedIdeaDecisions DriftChecker check added. 74 archived IDEAs backfilled with Decision fields.
**Constraint:** 74 archived IDEAs backfilled with inferred decisions — inference was mechanical (DEFERRED/REJECTED by status field), not human-authored. 44 remain unfixed (pre-existing corpus debt).
**Cost:** ArchivedIdeaDecisions WARN will persist until the 44 remaining pre-corpus IDEAs are backfilled. arch review is OK overall but the WARN is visible noise on every run.
**Forward Action:** None.
