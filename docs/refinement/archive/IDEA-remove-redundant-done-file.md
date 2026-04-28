# IDEA: Remove redundant DONE.md and simplify archiving
**Created:** 2026-04-28
**Source:** Human suggestion: "archive and done housekeeping. Is even DONE necessary?"
**Status:** PROMOTED → TASK-076
**Meta:** P2 | S | cli | docs/DONE.md, cli/src/main/ts/infrastructure/filesystem/markdown-task-repository.ts

## Problem
`docs/DONE.md` acts as a duplicated log of tasks already stored in `docs/archive/`. 
1. It creates redundancy (one file per task + one line in `DONE.md`).
2. The manual table update in `MarkdownTaskRepository.ts` is brittle and uses deprecated fields (like `sprint`).
3. It creates merge conflicts when multiple agents complete tasks.
4. `METRICS.md` and `arch status` already provide high-level summaries.

## Proposed solution
1. Remove `docs/DONE.md` from the repository.
2. Update `MarkdownTaskRepository.ts` to remove the `updateDoneTable` logic.
3. Standardize on `docs/archive/` as the single source of truth for completed work.
4. Ensure `arch status` and future metrics tools derive their data solely from the directory structure and task file metadata (`Closed-at`).

## Dependencies
None

## Estimated size
S (Requires CLI code changes + doc cleanup)

## Gaps
<!-- THINK fills this section when invoked — do not edit manually -->

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
