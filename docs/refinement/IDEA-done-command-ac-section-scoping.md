# IDEA: done-command-ac-section-scoping
**Meta:**Source: human | Status: DRAFT | Sessions: 1
**Created:** 2026-05-19

## Problem

`arch task done` checks for unchecked `- [ ]` items across the entire task file. This causes false failures on non-AC checkboxes — specifically the Context Feedback radio buttons auto-inserted by `arch task start` (`accurate / partial / off`), which are mutually exclusive: checking one implies the others remain unchecked by design.

During TASK-253 Auditor review, all 9 real ACs were verified and checked, `arch review` passed, but `arch task done` still refused with "unchecked Acceptance Criteria" because the two unchosen Context Feedback options remained `- [ ]`. The workaround was `--force`, which bypasses the guard entirely — a blunt instrument that could mask genuinely missed ACs.

`ValidateTaskAcs` already has the right behavior: it scopes to `### Acceptance Criteria` and `### Definition of Done` sections only (fixed in TASK-253). `arch task done` does not.

## Proposed direction

Apply the same section-scoping logic to the AC completeness check in `arch task done`:

- Only `- [ ]` items inside `### Acceptance Criteria` and `### Definition of Done` headings count as pending ACs.
- Items in `### Context Feedback`, `### Relevant Context`, and any other auto-generated sections are ignored.
- The `--force` flag remains available for genuine overrides.

Implementation is a one-function change in the task done command — extract the section-scoped content before checking for unchecked items, mirroring `ValidateTaskAcs.extractACSections`.

## Governance class

Class: I
Evaluates: Whether unchecked checkboxes represent pending ACs.
Does NOT evaluate: Whether the ACs are correct or complete — only whether they are checked.
Boundary risk: Negligible. This narrows false positives without weakening the actual guard.
