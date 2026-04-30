## TASK-144: Define stale lock resolution action in THINK Phase 1
**Meta:** P1 | XS | READY | Focus:yes | 6-writing | local | docs/agents/THINK.md
**Sprint:** sprint/v0.7-foundations

### Acceptance Criteria
- [ ] Add a resolution step to THINK Phase 1 System Check: if a stale lock is detected (task IN_PROGRESS with lock > 3 days), create a bug task in `docs/tasks/` citing the stale task ID and lock age, priority P1, status READY.
- [ ] The new step follows the existing bug protocol in `docs/guidelines/bugs.md`.
- [ ] `arch review` passes.

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
