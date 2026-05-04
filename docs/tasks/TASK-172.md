## TASK-172: Pivot to Dynamic Interactive Inbox
**Meta:** P1 | M | READY | Focus:no | 7-operations | local | cli/, docs/INBOX.md
**Depends:** none

### Acceptance Criteria
- [ ] Implement `HumanCoordinationService` to abstract approvals and instructions.
- [ ] Refactor `arch inbox` to be a dynamic CLI view that scans tasks/drifts in real-time instead of generating a file.
- [ ] Implement `arch approve <task-id>` and `arch redirect <task-id> --to "<instruction>"` as CLI commands.
- [ ] Persist human instructions by appending to a new `## Communication` section in the relevant task file.
- [ ] Deprecate `docs/INBOX.md` generation (keep as a minimal placeholder if needed).
- [ ] Ensure all CLI-driven coordination results in a git commit (Compliance with ADR-001).

### Context
#### Problem
`docs/INBOX.md` as a static file is stale and high-friction. The user wants a dynamic, interactive model.

#### Solution
Move the "Inbox" state from a middle-man file to a dynamic aggregation of task files and git state.

### Definition of Done
- [ ] `arch inbox` shows current real-time status.
- [ ] `arch approve` successfully updates a task and triggers a commit.
- [ ] `arch review` passes.

- [ ] arch review passes.
