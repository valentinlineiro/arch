# TASK-120: Implement Protocol Archival Guard
**Meta:** P2 | XS | 7 | DONE | Focus:yes | 7-operations | local | docs/agents/THINK.md
Closed-at: 2026-04-29T08:12:59Z

## Description
Update `THINK.md` Phase 1 to include an "Archival Guard" that autonomously archives DONE tasks.

## Acceptance Criteria
- [x] `THINK.md` Phase 1 includes a step to scan `docs/tasks/` for tasks with `Status: DONE`.
- [x] For each DONE task, the agent must autonomously move it to `docs/archive/`.
- [x] The archival must maintain the file name and metadata.
- [x] `arch review` passes.

## Context
- `docs/refinement/archive/IDEA-protocol-archival-guard.md`
