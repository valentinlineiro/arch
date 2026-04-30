# IDEA: Add Definition of Ready to TASK-FORMAT.md
**Created:** 2026-04-30
**Source:** Protocol audit — tasks have Definition of Done but no Definition of Ready; READY status criteria are implicit
**Status:** PROMOTED
**Meta:** P2 | XS | local | docs/TASK-FORMAT.md, docs/guidelines/core.md

## Problem
TASK-FORMAT.md defines a "Definition of Done" checklist but has no "Definition of Ready." The criteria for a task reaching `READY` status are implicit: anything that isn't blocked or an IDEA. As agent autonomy increases (L2+), this ambiguity creates risk — an agent may pick up a task that a human considers underspecified or unscoped.

## Proposed solution
Add a "Definition of Ready" section to TASK-FORMAT.md listing the minimum criteria a task must meet before it can be set to `READY`:
1. Title is clear and in English.
2. At least one Acceptance Criterion is defined.
3. Size is estimated (not XL — XL must be decomposed first).
4. No unresolved `**Depends:**` blocking it.
5. `Focus:no` by default (Flow Guard or human sets `Focus:yes`).
6. **Nemawashi gate (M+):** Tasks sized M or larger must have the `## Gaps` section filled (by THINK or human) before entering READY. This ensures agent and human are aligned on approach before implementation begins.

This makes the READY gate explicit and gives `arch review` a checklist to validate against.

## Dependencies
None.

## Estimated size
XS

## Gaps

## Decision
PROMOTE → TASK-146
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
