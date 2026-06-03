# IDEA: Split INBOX.md into NOTIFICATIONS.md (machine) and INBOX.md (human decisions)

**Status:** PROMOTED
**Created:** 2026-06-03
**Source:** Protocol audit — INBOX.md mixes machine alerts with human decision queue
**Candidate-class:** 1-code-reasoning
**Candidate-size:** S
**Depends:** none
**Decision:** Pending human review.

## Problem

INBOX.md currently mixes: machine-written governance alerts ([ANDON_HALT], [CORPUS_ALERT]), THINK session summaries ([ADVISORY]), human-pending decisions ([AWAITING_TRIAGE]), and triage entries. The file is both a notification channel and a decision queue. Machine entries are auto-written and should be auto-cleared. Human decision entries ([AWAITING_TRIAGE], [AWAITING_REVIEW]) persist until actioned. Mixing them in one file means the human scans machine noise to find actionable decisions.

## Proposed solution

Split into two files:
- NOTIFICATIONS.md — machine-written only ([ANDON_HALT], [CORPUS_ALERT], [ADVISORY], [STALE_TASK], [PATTERN-ALERT], [FLOW-REGRESSION]). Auto-cleared on govern tick after N days.
- INBOX.md — human decisions only ([AWAITING_TRIAGE], [AWAITING_REVIEW], [AWAITING_PROMOTION]). Persists until manually resolved.

arch govern writes to NOTIFICATIONS.md. arch triage reads from INBOX.md.

## Validation hints

- INBOX.md contains only human-actionable entries
- NOTIFICATIONS.md contains only machine-generated alerts
- arch triage reads INBOX.md; arch govern hygiene reads NOTIFICATIONS.md
