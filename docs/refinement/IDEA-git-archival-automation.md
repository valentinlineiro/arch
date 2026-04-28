# IDEA: Git Archival Automation
**Created:** 2026-04-28
**Source:** THINK agent (Phase 4)
**Status:** DRAFT
**Meta:** P2 | XS | 7-operations | docs/agents/THINK.md, scripts/arch.sh

## Problem
Currently, when a task is archived, the file is moved from `docs/tasks/` to `docs/archive/`, but the deletion and addition are not automatically staged in git. This leads to untracked files and "deleted but not staged" warnings in `arch review` and `git status`, creating noise and friction.

## Proposed solution
Integrate git staging into the archival process. When `arch archive` or an autonomous archival guard runs, it should automatically execute:
`git add docs/archive/TASK-XXX.md docs/tasks/TASK-XXX.md` (or equivalent `git rm` and `git add`).

## Dependencies
- IDEA-protocol-archival-guard (for autonomous trigger)

## Estimated size
XS

## Gaps
<!-- THINK fills this section when invoked — do not edit manually -->

## Decision
<!-- Human writes here after THINK evaluation -->
