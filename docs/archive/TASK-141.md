## TASK-141: Cap THINK Phase 2 IDEA scan to avoid unbounded overhead
**Meta:** P2 | S | DONE | Focus:no | 6-writing | local | docs/agents/THINK.md
**Closed-at:** 2026-04-30

### Acceptance Criteria
- [x] Add a triage rule to THINK Phase 2: skip IDEAs with no `Decision:` field and age > 2 sprints (signal: low-signal DRAFTs).
- [x] Add an explicit cap: process at most 3 DRAFT IDEAs per session, prioritizing those with a `Decision:` written.
- [x] Document the chosen rule in THINK.md so the agent applies it consistently.
- [x] `arch review` passes.

### Definition of Done
- [x] All ACs checked.
- [x] `arch review` passes.
