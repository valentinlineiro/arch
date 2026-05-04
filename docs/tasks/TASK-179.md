## TASK-179: Define IDEA TTL and stale-DRAFT auto-rejection in THINK.md
**Meta:** P2 | XS | REVIEW | Focus:yes | 6-writing | local | docs/agents/THINK.md
**Depends:** none

### Context
The refinement queue has 30+ IDEAs with no resolution path for long-lived DRAFTs. IDEAs can accumulate indefinitely, increasing Phase 2 overhead and reducing signal quality.

### Acceptance Criteria
- [x] THINK.md Phase 2 defines a TTL rule: DRAFT IDEAs present for 3+ THINK sessions without a Decision are flagged as `[STALE-IDEA]` in terminal output
- [x] THINK.md specifies that THINK appends a `**Sessions:** N` counter to each IDEA on each pass
- [x] THINK.md specifies: if no override Decision by the next session after flagging, agent moves IDEA to `docs/refinement/archive/` with `REJECTED: TTL expired`

### Definition of Done
- [x] `arch review` passes
