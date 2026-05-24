# IDEA: resolve-hansei-contradiction
**Decision-required:** yes
**Created:** 2026-05-22
**Source:** ARCH protocol review — Hansei requirement mismatch between DO.md and AGENTS.md/TASK-FORMAT.md
**Status:** DRAFT
Sessions: 5
**Decision-required:** yes

## Problem

Three documents specify conflicting Hansei requirements for XS/S tasks at close:

1. **`docs/agents/DO.md:20`** says: "always append a `## Hansei` section (1–3 sentences), even on XS/S happy-path work, because the close transition enforces its presence."

2. **`docs/TASK-FORMAT.md:146`** says: "XS/S: Hansei only when a triggering condition applies... No Hansei required on a clean XS/S close."

3. **`docs/AGENTS.md`** (Archiving requirements) says: "optional for XS/S unless a trigger applies."

An agent following DO.md would write a Hansei on every XS/S task. The close transition (`arch task done`) would then validate it as required — but the spec says it's optional. If the close transition actually enforces it, the spec is wrong. If the spec is correct, DO.md is providing incorrect instructions that cause unnecessary overhead.

## Proposed solution

Harmonize to a single rule. Two options exist; the spec (TASK-FORMAT.md) should be authoritative:

**Option A (keep conditional — align DO.md to spec):**
- Update DO.md:20 to match TASK-FORMAT.md: "Hansei is triggered-only for XS/S: write it only if a trigger applies (size miss, blocker, anomaly)."
- Remove "because the close transition enforces its presence" — if `arch task done` enforces Hansei on XS/S, fix the CLI, not the docs.

**Option B (make always-required — align spec to DO.md):**
- Update TASK-FORMAT.md and AGENTS.md to require Hansei on all tasks regardless of size.
- Remove the "triggered-only" language.
- This increases overhead on XS/S but ensures every task has a diagnostic record.

Recommendation: **Option A** — the triggered-only approach was deliberately designed (TASK-195, ADR-019) and DO.md's deviation is the bug.

## Dependencies
None.

## Estimated size
XS — single-round doc edit.

## Gaps

## Decision
PROMOTE → TASK-991 (Hansei contradiction DO.md vs TASK-FORMAT resolved)
**PROMOTE → TASK-991**
**Rationale:** Clean XS fix. Option A aligns spec with intent (ADR-019 triggered-only design). DO.md deviation is the bug.
