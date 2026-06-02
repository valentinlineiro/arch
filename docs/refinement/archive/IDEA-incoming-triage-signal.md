# IDEA: arch govern should write [AWAITING_TRIAGE] to INBOX for incoming remote ideas

**Status:** ARCHIVED
**Created:** 2026-05-28
**Source:** smartcart-os pilot — TASK-032 audit; confirmed in ARCH session 2026-06-02 (26 incoming ideas surfaced with no distinct signal)
**Candidate-class:** 7-operations
**Candidate-size:** XS
**Depends:** none

## Problem

When `arch govern` detects files in `.arch/incoming-ideas/`, it reports the count ("26 incoming IDEAs from remote") but writes no `[AWAITING_TRIAGE]` entry to INBOX.md. Incoming ideas are indistinguishable from human-authored DRAFT IDEAs in the queue. The action for an incoming idea ("is this signal real for this repo?") is different from the action for a locally-authored IDEA ("which task does this become?"), but INBOX treats them identically.

## Proposed change

When `arch govern` finds files in `.arch/incoming-ideas/` with no `Status: REJECTED` marker:
1. Append a dedicated `[AWAITING_TRIAGE]` block to INBOX.md listing each file and its source repo slug.
2. Preserve this block across `arch analyze` INBOX regeneration — THINK must not erase `[AWAITING_TRIAGE]` entries it did not generate.

## Acceptance Criteria

- [ ] `arch govern` appends `[AWAITING_TRIAGE]` to INBOX when `.arch/incoming-ideas/` contains unrejected files
- [ ] THINK's INBOX regeneration preserves `[AWAITING_TRIAGE]` entries
- [ ] `arch review` passes

## Sessions: 1

## Decision

PROMOTE → TASK-1085
