# IDEA: Define INBOX.md generation and update protocol
**Created:** 2026-04-30
**Source:** Protocol audit — GOVERNANCE.md references INBOX as escalation channel but no protocol defines when/how it is written
**Status:** DRAFT
**Meta:** P1 | S | local | docs/INBOX.md, docs/GOVERNANCE.md, docs/agents/THINK.md

## Problem
`docs/INBOX.md` is referenced in GOVERNANCE.md as the escalation channel for human-approval actions, but no protocol defines who generates it, when, or in what format. The current file is dated 2026-04-29 with stale data (shows 0 active tasks when 11 exist). THINK Phase 1 could naturally own this but has no instruction to do so.

## Proposed solution
Add INBOX regeneration as the final step of THINK Phase 1. After governance checks, the agent overwrites `docs/INBOX.md` with current state: active tasks, READY count, any pending escalations, and last-updated timestamp. Commit with `[THINK]` tag so the cadence counter resets correctly.

Separately, define the escalation write format for DO mode: when an action requires human approval per GOVERNANCE.md, DO appends a timestamped entry to INBOX before proceeding.

## Dependencies
None.

## Estimated size
S

## Gaps

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
