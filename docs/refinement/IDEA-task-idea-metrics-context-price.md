# IDEA: task-idea-metrics-context-price
**Created:** 2026-04-29
**Source:** Human — prioritization and agent context-awareness friction
**Status:** DRAFT
**Meta:** P2 | M | local | docs/TASK-FORMAT.md, docs/refinement/TEMPLATE.md

## Problem
Ideas and tasks lack quantitative signals beyond Value and Size to guide prioritization, acceptance, and rejection decisions. Additionally, agents operating near context limits have no way to detect and avoid tasks that are too large to complete safely within remaining context.

## Proposed solution
1. **Richer metrics on tasks and IDEAs:** Add fields that capture measurable signals relevant to prioritization — e.g., confidence score, estimated benefit, estimated risk/effort, or a composite priority score.
2. **Context price field:** Introduce a `ContextPrice` field (estimated token/context cost) on tasks and IDEAs. Agents approaching context limits can read this field and skip tasks whose context price would exceed their remaining budget.

## Dependencies
- TASK-FORMAT.md must be updated to reflect new fields.
- TEMPLATE.md must be updated for IDEAs.
- `arch review` drift checks may need updating if new required fields are added.

## Estimated size
M

## Gaps
<!-- THINK fills this section when invoked — do not edit manually -->

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
