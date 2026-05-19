# IDEA: guided-close-path
**Meta:**Source: human | Status: DRAFT | Sessions: 1
**Created:** 2026-05-19

## Problem
The close path (REVIEW, Hansei, Approval) has the most ceremony but the least tooling. Agents commit placeholder Hansei, forget Approval blocks, and use `--force` to bypass REVIEW — not from indiscipline but because the compliant path requires remembering five steps under pressure. The open path has `arch task capture` (guided, auto-fixing); the close path has nothing equivalent.

## Proposed direction
`arch task done <TASK-ID>` becomes the guided close path mirror of `arch task capture`:
- Detects placeholder or missing Hansei fields and invokes `hansei-wizard.ts` interactively
- Auto-generates the `## Approval` template on human confirmation
- Sets status to REVIEW, writes the REVIEW_REQUEST to INBOX, commits — one command
- `--batch` mode validates existing Hansei is non-placeholder and all fields meet the ≥10-char / controlled-vocabulary constraints, then closes without the wizard (for headless/CI contexts)
- `--force` emits a visible warning appended to INBOX rather than silently bypassing

## Governance class
Class: II
Evaluates: Structural completeness and compliance of the closure step.
Does NOT evaluate: Semantic quality of Hansei content.
Boundary risk: Medium — touches `mark-task-done.ts` and `hansei-wizard.ts`; must not change the task lifecycle invariants, only enforce them earlier.
