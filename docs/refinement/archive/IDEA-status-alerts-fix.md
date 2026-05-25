# IDEA: status-alerts-fix — arch status alert section reads INBOX correctly
**Created:** 2026-05-24
**Source:** Human UX — arch status shows raw markdown formatting in Alerts
**Status:** PROMOTED
**Meta:** P2 | XS | human | cli/src/main/ts/application/commands/status-command.ts

## Problem

`arch status` Alerts section currently filters INBOX.md lines containing `PATTERN-ALERT`, `ANDON_HALT`, or `CORPUS_ALERT` — but it uses a simple line match that also picks up:
- Lines with `**Title:**` from AWAITING_REVIEW blocks
- Stale escalation entries for closed tasks
- Markdown formatting that renders as `- **Title:** arch resume: ...`

A human running `arch status` sees noise in the most critical orientation command.

## Proposed Solution

Fix `status-command.ts` alert parsing:
1. Parse INBOX.md sections properly — only read lines from `## Alerts` section, not the full file
2. Filter to lines starting with `[ANDON_HALT]`, `[PATTERN-ALERT]`, `[CORPUS_ALERT]` exactly — not substring match
3. Deduplicate: same type+category shows once
4. Skip `[ADVISORY]` entries entirely (they are not actionable governance alerts)
5. Add alert count cap: show max 3, then "... N more — run arch govern inbox"

## Constraint Axes
- Dependency ordering: None
- Temporal validity: Valid now — bug is live
- Abstraction layer: Correct — status-command.ts only
- Observability validity: Deterministic — section parsing is verifiable
- Priority displacement: P2 XS — 20 lines of code

## Gaps
- None. The bug is well-understood.

## Decision
PROMOTE → TASK-1008
