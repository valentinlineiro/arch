## TASK-069: Implement deterministic auto-selection of the next task
**Meta:** P2 | S | READY | Focus:no | 1-implementation | local | docs/agents/DO.md, cli/
**Depends:** none

### Acceptance Criteria
- [ ] Define deterministic selection logic: Highest priority (`P0` > `P1`...), `Focus:yes` over `Focus:no`, then oldest by file creation time.
- [ ] Implement `arch next` command to output the next eligible task ID.
- [ ] Update `DO.md` to reference the auto-selection protocol when the agent is idle.
- [ ] Ensure the selector respects `Depends:` field (skips blocked tasks).

### Definition of Done
- [ ] `arch next` correctly identifies the next task in the current backlog.
- [ ] Blocked tasks are never selected.
- [ ] Unit tests for selection logic in `cli/`.
