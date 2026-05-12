# IDEA: Fix stale GUIDELINES.md reference in what-ai-must-never-do
**Created:** 2026-05-12
**Source:** Phase-3.5
**Status:** DRAFT
**Sessions:** 2
**Meta:** P3 | XS | writing | docs/guidelines/

## Problem
`docs/guidelines/what-ai-must-never-do-in-this-repo.md` contains a rule: "Modify GUIDELINES.md directly — propose via idea: prefix...". However, `GUIDELINES.md` no longer exists as a single file; it has been decomposed into the `docs/guidelines/` directory. This is a semantic drift finding from Phase 3.5.

## Proposed solution
Update the guideline to reference the `docs/guidelines/` directory and the protocol for modifying any file within it.

## Rationale
Ensures guidelines accurately reflect the current repository structure.

## Decision
PROMOTE → TASK-235 [influenced-by: none]
