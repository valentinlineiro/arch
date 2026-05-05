# IDEA: Archive compression — retain essential fields, discard bulk
**Created:** 2026-05-05
**Source:** Human proposal — Census check surfaced archive growth as a context-budget risk
**Status:** DRAFT
**Meta:** P2 | M | claude-code | docs/archive/, cli/

## Problem
`docs/archive/` currently stores full task files including Context sections, verbose Acceptance Criteria prose, and Hansei text. As tasks accumulate this drives up the Census line count (budget: 8000 lines) and makes the archive expensive to pass to an LLM as context. The information that matters long-term is a small fraction of each file.

## Proposed solution
Define a compressed archive format and an `arch task compress` (or `arch purge`) command that rewrites task files in `docs/archive/` to a minimal canonical form, keeping only:
- Task ID and title
- Meta line (priority, size, status, class, cost, turns)
- Closed-at date
- Final AC list (checked/unchecked state only, no prose)
- Hansei section (1–3 sentences — the highest-signal content)

Everything else (Context, Definition of Done body, lock lines, in-progress comments) is dropped. The result is a ~10-line entry per task instead of the current 20–50 lines, roughly halving the archive footprint.

## Related
- `IDEA-oracle-archive-distillation` — extracts wisdom *from* the archive into guidelines. Complementary: compress first, then distill.
- `IDEA-queryable-archive` — queryable archive would benefit from a uniform compressed schema.
- Census check (TASK-184) — the PURGE suggestion in the Census WARN message is the enforcement trigger for this operation.

## Dependencies
None. Compression can be applied incrementally to existing archive entries.

## Estimated size
M

## Gaps
- Define the exact compressed format (separate schema or subset of existing TASK-FORMAT).
- Decide whether compression is lossy (delete dropped fields) or lossless (move to a `.bak` or separate store).
- Decide trigger: manual command, or automatic when Census emits PURGE for `docs/archive/`.

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
