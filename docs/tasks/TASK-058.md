## TASK-058: System Hardening — Anti-drift and strict criteria
**Meta:** P2 | S | READY | Focus:no | 7-operations | local | cli/, arch.config.json, docs/
**Depends:** TASK-056

### Acceptance Criteria
- [ ] Remove dead paths (`sprint`, `backlog`, `done`) from `arch.config.json`
- [ ] Add path existence validation to `arch review` (if a path is in config, it must exist on disk)
- [ ] Add strict AC validation: `arch review` warns if a task is in `DONE` or `REVIEW` but has unchecked `[ ]` boxes
- [ ] Sync version across all docs (`AGENTS.md`, `ONBOARDING.html`) to read from `arch.config.json` (or remove hardcoding)

### Definition of Done
- [ ] CLI rebuilt with new validations
- [ ] `arch review` proactively detects AC and path inconsistencies
- [ ] PR approved
