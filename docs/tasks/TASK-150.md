## TASK-150: 5S Seiso - auto-create deletion tasks for persistent DeadPaths WARNs
**Meta:** P2 | S | DONE | Focus:no | 7-operations | local | cli/src/, docs/agents/THINK.md
**Sprint:** sprint/v0.7-foundations

### Acceptance Criteria
- [x] Update THINK Phase 1 to track DeadPaths WARNs across sessions: if the same WARN appears in 2 consecutive THINK sessions, create a P3 XS `chore` task in `docs/tasks/` proposing the specific deletion.
- [x] Define the tracking mechanism (e.g. a `## Persistent WARNs` section in THINK output, or a lightweight state entry in arch.config.json). (Chosen: `docs/KAIZEN-LOG.md` section `## Persistent WARNs`)
- [x] `arch review` passes.

### Definition of Done
- [x] All ACs checked.
- [x] `arch review` passes.
