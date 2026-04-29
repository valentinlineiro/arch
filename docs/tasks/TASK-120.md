# TASK-120: Implement Protocol Archival Guard
**Meta:** P2 | XS | 7 | IN_PROGRESS | Focus:yes | 7-operations | local | docs/agents/THINK.md

## Description
Update `THINK.md` Phase 1 to include an "Archival Guard" that autonomously archives DONE tasks.

## Acceptance Criteria
- [ ] `THINK.md` Phase 1 includes a step to scan `docs/tasks/` for tasks with `Status: DONE`.
- [ ] For each DONE task, the agent must autonomously move it to `docs/archive/`.
- [ ] The archival must maintain the file name and metadata.
- [ ] `arch review` passes.

## Context
- `docs/refinement/archive/IDEA-protocol-archival-guard.md`
