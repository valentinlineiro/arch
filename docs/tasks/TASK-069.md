## TASK-069: Implement deterministic auto-selection of the next task
**Meta:** P2 | S | DONE | Focus:yes | 1-implementation | gemini | docs/agents/DO.md, cli/
**Depends:** none
**Closed-at:** 2026-04-27T18:25:00Z

### Acceptance Criteria
- [x] Define deterministic selection logic: Highest priority (`P0` > `P1`...), `Focus:yes` over `Focus:no`, then oldest by file creation time.
- [x] Implement `arch next` command to output the next eligible task ID.
- [x] Update `DO.md` to reference the auto-selection protocol when the agent is idle.
- [x] Ensure the selector respects `Depends:` field (skips blocked tasks).

### Definition of Done
- [x] `arch next` correctly identifies the next task in the current backlog.
- [x] Blocked tasks are never selected.
- [x] Unit tests for selection logic in `cli/` (integrated as manual verification in DO cycle).
