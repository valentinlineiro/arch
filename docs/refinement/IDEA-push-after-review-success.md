# IDEA: Push to git after review is ok
**Created:** 2026-04-28
**Source:** Human suggestion: "push to git after review is ok"
**Status:** DRAFT
**Meta:** P3 | S | cli | scripts/arch.sh

## Problem
Currently, `arch review` checks for health but doesn't automate the push step. Automating this after a successful review could streamline the delivery flow for verified changes.

## Proposed solution
Add an option or logic to `arch review` or a new command that performs a `git push` only if the system review passes all checks.

## Dependencies
None

## Estimated size
S

## Gaps
<!-- THINK fills this section when invoked — do not edit manually -->

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
