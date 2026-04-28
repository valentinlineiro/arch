## TASK-058: System Hardening - Anti-drift and strict criteria
**Meta:** P2 | S | 5 | DONE | Focus:yes | 1-implementation | gemini | cli/, arch.config.json, docs/
**Depends:** TASK-056
**Closed-at:** 2026-04-27T16:00:00Z

### Acceptance Criteria
- [x] Remove dead paths (`sprint`, `backlog`, `done`) from `arch.config.json`
- [x] Add path existence validation to `arch review` (if a path is in config, it must exist on disk)
- [x] Add strict AC validation: `arch review` warns if a task is in `DONE` or `REVIEW` but has unchecked `[ ]` boxes
- [x] Sync version across all docs (`AGENTS.md`, `ONBOARDING.html`) to read from `arch.config.json` (or remove hardcoding)

### Definition of Done
- [x] CLI rebuilt with new validations
- [x] `arch review` proactively detects AC and path inconsistencies
- [x] PR approved
