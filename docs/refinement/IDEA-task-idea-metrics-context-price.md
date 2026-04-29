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
- **Metric set underspecified:** "confidence, benefit, risk/effort, composite" is four fields — needs narrowing to the minimum useful set to avoid maintenance bloat on every task/IDEA.
- **ContextPrice estimability:** Token cost is dynamic (depends on model, agent state). A static ordinal scale (XS/S/M/L matching t-shirt sizing) may be more practical than a numeric value.
- **Migration scope unaddressed:** If new fields are required in Meta, all existing tasks and IDEAs become non-compliant immediately. A migration or "optional until X" policy needs to be defined.
- **Sizing may be L not M:** Touching TASK-FORMAT.md, TEMPLATE.md, arch review drift checks, and potentially all existing task files is broader than M.
- **Consumer unclear:** If the new metrics are for human prioritization only, this is a display/format improvement. If agents also read them (e.g., to skip high-context tasks), the protocol must specify where/when agents consult these fields.

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
