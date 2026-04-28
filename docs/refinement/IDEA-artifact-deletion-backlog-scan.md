# IDEA: arch review detects stale references to deleted files
**Created:** 2026-04-28
**Source:** KAIZEN-LOG — Legacy tasks with stale dependencies
**Status:** DRAFT
**Meta:** P2 | S | 7-operations | cli/src/main/ts/domain/services/drift-checker.ts

## Problem
When a file (protocol, guide, or script) is deleted, existing tasks in the backlog may still reference it in their `Meta` or `Depends` lines. This leads to confusion during execution.

## Proposed solution
Add a new check to `DriftChecker` or a new Rule to `Reviewer` that:
1. Collects all file paths/contexts mentioned in `docs/tasks/*.md`.
2. Verifies each path exists in the repository.
3. Reports any "Dead Context" or "Stale Dependency" as a WARN.

## Estimated size
S

## Gaps
- How to handle glob patterns in the context field?
- Performance impact of scanning every task file for every review.

## Decision
<!-- Human writes here after THINK evaluation -->
