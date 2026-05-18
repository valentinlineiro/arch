# IDEA: fix-commit-exception-contradiction
**Meta:**Source: Phase-2.5 | Status: DRAFT | Sessions: 2
**Created:** 2026-05-15

## Problem
`docs/guidelines/core.md` section 2 states: "Every commit must reference a TASK-ID."
`GEMINI.md` section "Hard limits" (or "Invariants") states: "Exception: `idea:` commits for IDEA drafts do not require a TASK-ID."

This is a conceptual contradiction that creates ambiguity for agents performing idea refinement or creating new IDEAs.

## Proposed direction
Update `docs/guidelines/core.md` to include the exception for `idea:` commits, matching `GEMINI.md`.

## Governance class
Class: I
Evaluates: Structural consistency of commit guidelines.
Does NOT evaluate: Whether the exception is architectural sound (already decided in GEMINI.md).
Boundary risk: Low.
