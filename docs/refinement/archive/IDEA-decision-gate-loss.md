# IDEA: Decision-gated idea loss
**Created:** 2026-05-16
**Source:** Human observation — operational friction
**Status:** PROMOTED
**Sessions:** 0
**Meta:** P1 | S | 1-code-reasoning | cli/src/main/ts/, docs/agents/THINK.md

## Problem

Structurally sound IDEAs are being lost not because they are stale, wrong, or capability-gated — but because the human never made a binary decision on them.

The current lifecycle has one recourse for undecided IDEAs: TTL-archival after 4 THINK sessions with status `REJECTED: TTL expired`. This is a false rejection. The IDEA was not evaluated and found wanting — it was evaluated and found waiting. The system conflates undecided with invalid.

The real failure mode: an IDEA sits in `AWAITING_PROMOTION` across multiple sessions. THINK re-evaluates it, increments Sessions, appends to `escalations.jsonl`, and eventually archives it as expired. The human never saw a forcing function. The idea disappears silently.

This is not a TTL problem. It is a decision-loop closure problem.

## Root Cause

`AWAITING_PROMOTION` is written to `escalations.jsonl` as an open escalation but there is no mechanism that:
1. Surfaces the escalation at a time when the human is making decisions (not just reading INBOX)
2. Forces a binary outcome (PROMOTE or REJECT with reason)
3. Distinguishes between "not yet decided" and "decided to defer"

The current INBOX lists pending promotions as a count and slug list. It does not present them as decisions requiring closure. A human can read INBOX, absorb the list, and close the tab without acting — and the system treats that as a valid state.

## Proposed Solution

**A. Decision-required marker on IDEAs**

IDEAs with `Sessions >= 2` and no Decision field get a `**Decision-required:** yes` marker added by THINK. This makes the gap explicit in the file itself, not just in INBOX.

**B. `arch inbox --decisions` filter**

A dedicated view that shows only IDEAs with open `AWAITING_PROMOTION` escalations, sorted by sessions descending (most overdue first). Each entry shows: slug, title, one-line problem summary, sessions count, created date. Designed for a 5-minute decision session, not reading.

**C. Separation of DEFERRED from TTL-expired**

A human-writable `DEFERRED` status distinct from `REJECTED: TTL expired`. If a human explicitly writes `DEFERRED: <reason>` in the Decision field, THINK archives it with that status and re-surfaces it only when the stated condition is met (or never, if no condition is given). TTL-archival only applies to IDEAs with no human interaction at all — zero Decision field content.

**D. Decision audit trail**

Every IDEA archived must have a Decision field with at least one of: `PROMOTE`, `REJECT: <reason>`, or `DEFERRED: <reason>`. An IDEA archived with an empty Decision field is a protocol violation, detectable by `arch review`.

## Constraint Axes
- Dependency ordering: None — standalone
- Temporal validity: Valid now, becomes more urgent as queue grows
- Abstraction layer: Correct — lifecycle concern, not implementation concern
- Observability validity: Detectable (empty Decision on archived IDEA)
- Priority displacement: P1 — directly affects corpus quality and idea retention

## Relationship to existing artifacts
- **TENSION-003** — distinct: TENSION-003 is about capability-gated IDEAs missing a lifecycle state. This is about undecided IDEAs being silently expired.
- **TTL-archival (THINK Phase 1)** — overlapping: the TTL mechanism is part of the problem, not the solution. Proposed fix modifies its behavior.
- **IDEA-daas-hansei-wizard** — pattern: same DaaS philosophy — reduce ceremony friction by making the correct action the easiest one.

## Decision
PROMOTE → TASK-893
