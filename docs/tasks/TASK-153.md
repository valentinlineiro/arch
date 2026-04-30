## TASK-153: Add pre-flight constraint check to DO mode (SENTINEL)
**Meta:** P1 | S | READY | Focus:yes | 7-operations | local | docs/agents/DO.md, arch.config.json
**Sprint:** sprint/v0.7-foundations

### Acceptance Criteria
- [ ] Add a "Sentinel Pre-flight" step to `DO.md` Intent: Execute Task, between task selection and locking.
- [ ] The step requires an XS reasoning call to verify the task's ACs and description against a `negativeConstraints` list in `arch.config.json`.
- [ ] Add an initial `negativeConstraints` list to `arch.config.json` with at least three constraints (e.g., no new npm deps for < M tasks, no modifying protectedPaths without ADR).
- [ ] Define the escalation path: if the pre-flight check fails, the agent must pause and append an `AWAITING_APPROVAL | SENTINEL_VIOLATION` entry to `docs/INBOX.md`.
- [ ] `arch review` passes.

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
