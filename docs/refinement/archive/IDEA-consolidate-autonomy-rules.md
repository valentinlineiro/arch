# IDEA: Consolidate L2 Autonomy rules to single canonical source
**Created:** 2026-05-08
**Source:** Phase-3.5
**Status:** DRAFT
**Sessions:** 2
**Meta:** P3 | XS | writing | docs/

## Problem
The rule for L2 autonomous promotion (XS + 6-writing/7-operations + human decision) is repeated across `docs/AGENTS.md`, `docs/guidelines/autonomy.md`, and `docs/agents/THINK.md`. This violates ADR-013 (structural duplication) and creates a risk of rules drifting apart during maintenance.

## Proposed solution
1. Designate `docs/guidelines/autonomy.md` as the canonical source for autonomy-related rules.
2. Update `docs/AGENTS.md` and `docs/agents/THINK.md` to reference the rule by name/link instead of repeating it.

## Rationale
Adheres to ADR-013 and simplifies protocol maintenance.

## Dependencies
None.

## Estimated size
XS

## Gaps

## Decision
PROMOTE → TASK-237 [influenced-by: none]
