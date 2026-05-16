# IDEA: Resurrection review — surface TTL-rejected IDEAs for human re-evaluation
**Created:** 2026-05-16
**Source:** Human observation — operational debt
**Status:** PROMOTED
**Sessions:** 0
**Meta:** P2 | S | 6-writing | docs/refinement/archive/

## Problem

TTL-rejection is not a human decision — it is a timeout. An IDEA archived as `REJECT: TTL expired` was not evaluated and found wrong; it was evaluated and found waiting. Over time, the context that made an IDEA premature changes: system capabilities mature, priorities shift, a related task closes, or the problem resurfaces in a different form.

Currently there is no mechanism to re-surface these IDEAs. They sit in `docs/refinement/archive/` indefinitely. The only way to recover one is to remember it exists and manually re-open it — which defeats the purpose of a memory system.

There are currently 18 IDEAs in archive with `REJECT: TTL expired` status. Some are genuinely dead. Others are valid ideas that stalled because the system was not ready, the human was not available, or the problem had not yet been felt concretely enough to decide.

## Proposed Solution

**A. `arch inbox --resurrect` subcommand**

Lists all archived IDEAs with `REJECT: TTL expired` (or `DEFERRED`) status, sorted by creation date ascending (oldest first). For each entry shows: slug, title, one-line problem summary, original creation date, sessions count. Designed to be run once per sprint as a resurrection review pass.

**B. Re-open mechanic**

A human who wants to resurrect an IDEA moves it from `docs/refinement/archive/` back to `docs/refinement/`, clears the Decision field, and resets Status to `DRAFT`. THINK treats it as a fresh IDEA on next evaluation — Sessions counter is preserved as historical context, not as a TTL countdown (a resurrected IDEA gets a fresh TTL from the moment of re-opening).

**C. THINK Phase 3 periodic trigger**

Every N govern ticks (configurable, default 20), THINK Phase 3 emits a reminder to `docs/INBOX.md`: `[RESURRECTION-REVIEW] N TTL-rejected IDEAs in archive — run arch inbox --resurrect to evaluate`. Does not auto-resurface, does not auto-promote. Humans decide.

## Constraint Axes
- Dependency ordering: Depends on TASK-893 (ArchivedIdeaDecisions) — DONE
- Temporal validity: Valid now; becomes more valuable as archive grows
- Abstraction layer: Correct — lifecycle concern
- Observability validity: Detectable (TTL-rejected status is machine-readable)
- Priority displacement: P2 — useful but not blocking anything

## Decision
PROMOTE → TASK-906
