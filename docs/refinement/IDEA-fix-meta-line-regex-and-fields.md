# IDEA: fix-meta-line-regex-and-fields
**Decision-required:** yes
**Created:** 2026-05-22
**Source:** ARCH protocol review — Meta line regex doesn't match documented field semantics
**Status:** DRAFT
Sessions: 3

## Problem

Two specification defects in the Meta line definition:

**1. `Turns:` field missing from regex:**
TASK-FORMAT.md §8 says `Turns: N` is "Appended to the Meta line at close, after the Context field." But the authoritative regex at TASK-FORMAT.md:220 ends with `(?<context>.+)$` — no `Turns` capture group. Either Turns is inside the Meta line (regex needs updating) or Turns is a separate line below Meta (spec needs clarifying). The example shows `Turns: 12` inside the meta string at TASK-FORMAT.md:139.

**2. `Locked-commit` field undocumented:**
AGENTS.md (Invariants) specifies `Locked-commit` as "a persisted auxiliary provenance field written below the Meta line (not in it)." But TASK-FORMAT.md — the canonical format spec — doesn't mention this field. An agent reading only TASK-FORMAT.md wouldn't know this field exists.

## Proposed solution

**For Turns:** Add `( \| Turns: (?<turns>\d+))?` to the Meta line regex. Update the format spec to show Turns as an optional trailing Meta field.

**For Locked-commit:** Add a `## Auxiliary Fields` section to TASK-FORMAT.md documenting: `Locked-commit`, `Created-at`, `Actor` (observed in TASK-975), and their semantics. Clarify which are parser-strict vs. advisory.

## Dependencies
None — pure documentation fix.

## Estimated size
S — impacts regex in TypeScript validator and documentation in two files.

## Gaps

## Decision

**PROMOTE → TASK-990**
**Rationale:** Well-bounded spec fix. Add Turns capture group to regex + document Locked-commit and auxiliary fields in TASK-FORMAT.md.
