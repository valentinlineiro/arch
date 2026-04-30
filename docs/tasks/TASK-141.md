## TASK-141: Cap THINK Phase 2 IDEA scan to avoid unbounded overhead
**Meta:** P2 | S | READY | Focus:no | 6-writing | local | docs/agents/THINK.md

### Acceptance Criteria
- [ ] Add a triage rule to THINK Phase 2: skip IDEAs with no `Decision:` field and age > 2 sprints (signal: low-signal DRAFTs).
- [ ] Or add an explicit cap: process at most N IDEAs per session (e.g. 5), prioritizing those with a `Decision:` written.
- [ ] Document the chosen rule in THINK.md so the agent applies it consistently.
- [ ] `arch review` passes.

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
