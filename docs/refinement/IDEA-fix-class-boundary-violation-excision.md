# IDEA: fix-class-boundary-violation-excision
**Meta:**Source: Phase-2.5 | Status: DRAFT | Sessions: 1
**Created:** 2026-05-18

## Problem
`DriftChecker.checkExcisionStructure` Gate 2 currently evaluates the *content* of decision records (checking for the string `REJECT`) to validate a deletion.
According to `docs/GOVERNANCE.md`, evaluating human intent is a Class II activity. Class I checks should only verify the *presence* of a decision record, not its semantic content.
"Presence closes the Class I gate — regardless of artifact content."

## Proposed direction
Refactor `checkExcisionStructure` Gate 2 to verify the existence of a decision record (IDEA in archive or ADR) referencing the artifact, without requiring the content to include `REJECT`. If more semantic validation is needed, it should be moved to a Class II analysis (THINK).

## Governance class
Class: I
Evaluates: Structural consistency of governance checks with the epistemological boundary.
Does NOT evaluate: Whether the excision itself was correct.
Boundary risk: Low.
