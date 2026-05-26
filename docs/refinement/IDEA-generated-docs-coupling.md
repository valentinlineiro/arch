# IDEA: Generate documentation from state rather than maintaining prose
**Created:** 2026-05-25
**Source:** Human structural review
**Status:** DRAFT
**Meta:** P0 | L | local | docs/refinement/

## Problem
ROADMAP, INBOX, and the arch check→arch review rename all exhibit the same pattern: prose-heavy artifacts drift the moment they're written. There is no structural coupling between the documents and the state they describe. The rename was "fixed" in AGENTS.md but remained in 17+ other files — the fix was shallow because there is no generation pipeline to propagate it. Every manually maintained doc is a liability that accumulates drift at a rate proportional to system velocity.

## Proposed solution
Identify which documentation artifacts are purely derivable from machine-readable state (task counts, status projections, command references) and generate them. ROADMAP phase completion status should be derived from task archive state, not hand-edited. INBOX summary block should be generated (see IDEA-dual-truth-reconciliation). Command references in docs should be sourced from a canonical registry, not inline prose. The goal is not to eliminate all prose — it is to eliminate prose that pretends to be state.

**External analysis (DeepSeek, 2026-05-25):** Correctly names the principle: "rendered, not written." Notes that `status-projection.json` and `arch review` counters already exist as source-of-truth inputs — the generation pipeline is the missing piece, not new data. Proposes injecting computed state into existing prose files on every govern tick. **This mechanism is wrong:** injecting generated content into shared prose files blurs ownership — what is generated and what is human-authored becomes indistinguishable, and every govern tick creates a merge hazard. The correct fix is separate files with explicit ownership boundaries (see IDEA-dual-truth-reconciliation), not injection into shared artifacts. The principle is adopted; the mechanism is rejected.

## Dependencies
- TASK-1018 (arch check → arch review rename sweep — the mechanical fix; this IDEA prevents recurrence)
- IDEA-dual-truth-reconciliation (INBOX split is a specific instance of this pattern)

## Estimated size
L

## Gaps

## Decision
ROADMAP. Correct principle ("rendered, not written"), but L-sized with no isolated first deliverable. The INBOX split (IDEA-dual-truth-reconciliation) is the only currently-scoped instance of this pattern. Moving to ROADMAP-IDEAS.md. Graduation condition: identify one additional derivable artifact beyond INBOX and define its generation pipeline as a standalone S task — that S task becomes the entry point, not this IDEA.
