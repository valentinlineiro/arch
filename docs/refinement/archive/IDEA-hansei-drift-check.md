# IDEA: Hansei drift check in arch review
**Created:** 2026-05-05
**Source:** Split from IDEA-mechanize-protocol-controls
**Status:** DRAFT
**Sessions:** 1
**Meta:** P1 | XS | claude-code | cli/src/main/ts/domain/services/drift-checker.ts, docs/TASK-FORMAT.md

## Problem
`## Hansei` is mandated by DO.md on task close but is convention-only. `arch review` cannot verify whether it was written. Tasks are being archived without reflection, undermining the learning loop.

## Proposed solution
Two steps:
1. Update `TASK-FORMAT.md` to mark `## Hansei` as a required section on DONE tasks.
2. Add a `HanseiPresent` drift check to `DriftChecker`: scan `docs/archive/*.md` for tasks missing a `## Hansei` section and surface each as a named violation.

Follows the existing DriftChecker pattern exactly. XS because the parser is a single regex scan and the format change is one line.

## Dependencies
None.

## Estimated size
XS

## Gaps
None identified.

## Decision
<!-- Human writes here after THINK evaluation -->
