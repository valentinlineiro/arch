## TASK-118: ARCH Context Pruning - Stale Task Identification
**Meta:** P2 | S | 6 | DONE | Focus:yes | 7-operations | local | cli/src/, docs/agents/THINK.md
**Closed-at:** 2026-04-29T10:20:46.463Z

## Description
Implement a mechanism to identify and handle stale tasks in `docs/tasks/` that have not seen activity for a significant period.

## Acceptance Criteria
- [x] Add a "Staleness Check" logic (can be integrated into `arch review` or `THINK` mode).
- [x] The check must identify tasks in `READY` or `BLOCKED` status that have not been modified or referenced in a commit for > 30 days.
- [x] Flag identified tasks as STALE in the `THINK` report.
- [x] Provide a way to archive these tasks with a `REJECTED: stale` status or move them to a sub-directory.
- [x] `arch review` passes.

## Context
- `docs/refinement/archive/IDEA-arch-context-pruning-stale-tasks.md`
