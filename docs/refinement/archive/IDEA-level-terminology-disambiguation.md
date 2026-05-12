# IDEA: Disambiguate "Level" terminology between Autonomy and Escalation
**Created:** 2026-05-08
**Source:** Phase-3.5
**Status:** DRAFT
**Sessions:** 2
**Meta:** P2 | XS | writing | docs/

## Problem
Currently, two different scales use the "Level N" terminology:
1. **Autonomy Levels (L1-L4)** defined in `docs/guidelines/autonomy.md`.
2. **Escalation Maturity Levels (L1-L7)** defined in `IDEA-escalation-maturity.md` and `ADR-010`.

This creates confusion (e.g., "reaching Level 3") and potential terminal collision as ARCH advances in both areas.

## Proposed solution
Rename one or both scales to use specific, non-overlapping prefixes:
- Autonomy: **Capability Level (C1-C4)**
- Escalation: **Enforcement Level (E1-E7)** or **Maturity Level (M1-M7)**

## Rationale
Ensures that system goals and review violations are unambiguous. "Violates C3" is clearly an autonomy issue; "Violates E3" is clearly an escalation/safety issue.

## Dependencies
None.

## Estimated size
XS — updating docs/guidelines/autonomy.md, docs/adr/ADR-010-escalation-maturity.md, and relevant task files.

## Gaps

## Decision
PROMOTE → TASK-238 [influenced-by: none]
