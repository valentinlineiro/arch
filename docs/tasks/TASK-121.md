# TASK-121: Implement Protocol Flow Guard
**Meta:** P2 | XS | 8 | IN_PROGRESS | Focus:yes | 7-operations | local | docs/agents/THINK.md

## Description
Update `THINK.md` Phase 4 to include a "Flow Guard" to autonomously focus tasks when focus is empty.

## Acceptance Criteria
- [ ] `THINK.md` Phase 4 includes a "Flow Guard" step.
- [ ] If 0 tasks have `Focus:yes`, the agent identifies the `READY` task with the highest Value/Size ratio.
- [ ] The agent autonomously sets `Focus:yes` for that task.
- [ ] `arch review` passes.

## Context
- `docs/refinement/archive/IDEA-protocol-flow-guard.md`
