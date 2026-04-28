# IDEA: Align IDEA template Meta with task-format CLI field
**Created:** 2026-04-28
**Source:** THINK Phase 3 Kaizen — TEMPLATE.md uses [tool] but TASK-FORMAT uses `cli`; three IDEAs missing the field
**Status:** DRAFT
**Meta:** P3 | XS | 6-writing | docs/refinement/TEMPLATE.md

## Problem
`docs/refinement/TEMPLATE.md` has `[tool]` as the fourth Meta field. `docs/TASK-FORMAT.md` uses `cli` for the same concept. Three existing IDEAs (opt-in-project-registry, standard-autonomous-actions, unify-ui-angular) are missing the field entirely. THINK must infer routing, creating ambiguity.

## Proposed solution
- Rename `[tool]` → `[cli]` in `TEMPLATE.md` Meta line to match TASK-FORMAT.
- Add a one-line note: "cli: target AI CLI for execution (local | claude | gemini | human)".
- Backfill the three IDEAs missing the field with best-effort values.

## Dependencies
None.

## Estimated size
XS

## Gaps
<!-- THINK fills this section when invoked — do not edit manually -->

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
