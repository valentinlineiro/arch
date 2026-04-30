# IDEA: arch review dependency graph validation
**Created:** 2026-04-30
**Source:** THINK Phase 4 (Drift Prevention)
**Status:** DRAFT
**Meta:** P3 | S | 7-operations | scripts/arch.sh, cli/

## Problem
Currently, task dependencies are listed in the `Depends:` field, but they are not validated. A task might depend on a non-existent task, or there could be circular dependencies that block the backlog indefinitely.

## Proposed solution
Enhance `arch review` to:
1. Parse `Depends:` fields in all `docs/tasks/` files.
2. Verify that every referenced TASK-ID exists either in `docs/tasks/` or `docs/archive/`.
3. Build a dependency graph and check for cycles.
4. Report invalid dependencies or cycles as protocol violations.

## Dependencies
None

## Estimated size
S

## Gaps
<!-- THINK fills this section when invoked — do not edit manually -->

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
