# IDEA: fix-decomposition-duplication
**Meta:**Source: Phase-2.5 | Status: DRAFT | Sessions: 2
**Created:** 2026-05-15

## Problem
The rule that XL tasks must be decomposed is duplicated:
1. `docs/guidelines/core.md` section 4: "Decomposition: Tasks estimated XL must be decomposed before entering READY status."
2. `GEMINI.md` section "Hard limits": "No XL tasks in READY — decompose first."

## Proposed direction
Consolidate the rule into `docs/guidelines/core.md` and have `GEMINI.md` reference it if necessary, or simply remove the duplication to reduce maintenance cost.

## Governance class
Class: I
Evaluates: Structural duplication in documentation.
Does NOT evaluate: Whether the rule itself is correct.
Boundary risk: Low.
