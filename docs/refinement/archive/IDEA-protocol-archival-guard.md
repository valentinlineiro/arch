# IDEA: Protocol Archival Guard
**Created:** 2026-04-28
**Source:** THINK agent
**Status:** PROMOTED -> TASK-120
**Meta:** P2 | XS | 7-operations | docs/agents/THINK.md

## Problem
Tasks marked as `DONE` often remain in `docs/tasks/` until a manual `arch archive` or `arch done` command is run, cluttering the active task space and consuming unnecessary context.

## Proposed solution
Update `THINK.md` Phase 1 to include an "Archival Guard":
If any tasks in `docs/tasks/` have `Status: DONE`, the THINK agent autonomously archives them to `docs/archive/` (following the naming and metadata conventions).

## Dependencies
none

## Estimated size
XS

## Gaps
<!-- THINK fills this section when invoked — do not edit manually -->

## Decision
<!-- Human writes here after THINK evaluation -->
