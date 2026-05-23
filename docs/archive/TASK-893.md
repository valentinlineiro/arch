## TASK-893: Decision-gated idea loss: prevent silent TTL expiry of undecided IDEAs
**Meta:** P1 | M | DONE | Focus:no | 1-code-reasoning | claude-code | cli/src/main/ts/, docs/agents/THINK.md
**Closed-at:** 2026-05-16T10:52:21.646Z
**Depends:** none

## Hansei
**Severity:** H0
**Category:** [AuditGap]
**Decision:** Implemented all 5 ACs. THINK.md updated with decision-required marker, TTL block, and DEFERRED status. arch inbox --decisions live. ArchivedIdeaDecisions DriftChecker check added. 74 archived IDEAs backfilled with Decision fields.
**Constraint:** 74 archived IDEAs backfilled with inferred decisions — inference was mechanical (DEFERRED/REJECTED by status field), not human-authored. 44 remain unfixed (pre-existing corpus debt).
**Cost:** ArchivedIdeaDecisions WARN will persist until the 44 remaining pre-corpus IDEAs are backfilled. arch review is OK overall but the WARN is visible noise on every run.
**Forward Action:** None.
