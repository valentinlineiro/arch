# TASK-121: Implement Protocol Flow Guard
**Meta:** P2 | XS | 8 | REVIEW | Focus:yes | 7-operations | local | docs/agents/THINK.md

## Description
Update `THINK.md` Phase 4 to include a "Flow Guard" to autonomously focus tasks when focus is empty.

## Acceptance Criteria
- [x] `THINK.md` Phase 4 includes a "Flow Guard" step.
- [x] If 0 tasks have `Focus:yes`, the agent identifies the `READY` task with the highest Value/Size ratio.
- [x] The agent autonomously sets `Focus:yes` for that task.
- [x] `arch review` passes.

## Context
- `docs/refinement/archive/IDEA-protocol-flow-guard.md`
