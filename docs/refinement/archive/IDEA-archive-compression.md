# IDEA: Archive compression — retain essential fields, discard bulk
**Created:** 2026-05-05
**Source:** Human proposal — Census check surfaced archive growth as a context-budget risk
**Status:** PROMOTED → TASK-200
**Meta:** P2 | M | claude-code | docs/archive/, cli/

## Problem
`docs/archive/` currently stores full task files including Context sections, verbose Acceptance Criteria prose, and Hansei text. As tasks accumulate this drives up the Census line count (budget: 8000 lines) and makes the archive expensive to pass to an LLM as context. The information that matters long-term is a small fraction of each file.

## Proposed solution
Define a compressed archive format and an `arch task compress` command that rewrites task files in `docs/archive/` to a minimal canonical form. The format is a curated subset of TASK-FORMAT (no new schema — existing tooling reads it unchanged), retaining only the fields that enrich Kaizen sessions:
- Task ID and title
- Meta line (priority, size estimated vs actual, status, class, cost, turns)
- Closed-at date
- Hansei section (1–3 sentences — highest-signal content for ORACLE and THINK)
- Blockers encountered (if any)

Everything else (Context, AC prose, lock lines, implementation notes) is dropped. Compression is **lossy** — git history preserves the original if ever needed. The result is a ~10-line entry per task instead of the current 20–50 lines, roughly halving the archive footprint.

**Trigger:** Automatic when Census emits a PURGE warning for `docs/archive/`; `arch task compress` also available as a manual command.

## Related
- `IDEA-oracle-archive-distillation` — extracts wisdom *from* the archive into guidelines. Complementary: compress first, then distill.
- `IDEA-rag-context-retrieval` — RAG indexes the archive; compressed uniform entries improve chunk quality and reduce embedding cost. Compress before indexing.
- Census check (TASK-184) — the PURGE suggestion in the Census WARN message is the enforcement trigger for this operation.

## Dependencies
None. Compression can be applied incrementally to existing archive entries.

## Estimated size
M

## Gaps
All resolved:
- **Format:** Curated subset of TASK-FORMAT (no new schema).
- **Lossy/lossless:** Lossy — git history is the recovery path.
- **Trigger:** Automatic on Census PURGE + manual `arch task compress`.

## Decision
PROMOTE → TASK-200
