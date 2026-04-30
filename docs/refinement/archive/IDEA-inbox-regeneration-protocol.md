# IDEA: INBOX.md as primary governance surface for autonomous loop
**Created:** 2026-04-30
**Source:** Protocol audit + autonomous loop architecture — INBOX is the human interaction layer when arch loop runs unattended
**Status:** PROMOTED
**Meta:** P1 | M | local | docs/INBOX.md, docs/GOVERNANCE.md, docs/agents/THINK.md, docs/agents/DO.md

## Problem
`docs/INBOX.md` is referenced in GOVERNANCE.md as the escalation channel but has no defined generation protocol, write format, or triage flow. When `arch loop` runs autonomously, the human needs a single, reliable surface to review what happened, approve promotions, and unblock Andon Cord halts — without reading git logs or scanning task files directly.

## Proposed solution
Elevate INBOX to the primary human interaction layer for the autonomous loop:

**Generation:** THINK Phase 1 overwrites `docs/INBOX.md` at the end of each session with:
- Loop status (running / halted / awaiting input)
- Active and READY task counts
- Pending items by type: `AWAITING_PROMOTION`, `AWAITING_REVIEW`, `ANDON_HALT`
- Last 5 completed tasks with one-line summaries

**Write protocol for DO/loop:** Any action hitting a human-approval gate appends a timestamped, typed entry to INBOX before halting. Format:
```
## [YYYY-MM-DD HH:MM] AWAITING_PROMOTION
IDEA-foo — gaps filled, XS 7-operations, ready to promote
```

**Triage:** The human writes one of: `APPROVE`, `REJECT: reason`, or `DEFER` inline. The loop reads INBOX on resume and routes accordingly.

## Dependencies
IDEA-andon-cord (defines the ANDON_HALT entry type).

## Estimated size
M

## Gaps

## Decision
PROMOTE → TASK-148
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
