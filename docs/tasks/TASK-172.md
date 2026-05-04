## TASK-172: Dynamic Interactive Inbox (Non-file based)
**Meta:** P1 | M | READY | Focus:no | 2-code-generation | local | cli/, docs/INBOX.md
**Depends:** - `TASK-170` (needs to be pivoted/re-decomposed)
- `ADR-001` (Compliance: All actions must still result in git commits)

### Acceptance Criteria
- [ ] Dynamic Interactive Inbox (Non-file based)

### Context
#### Problem
Currently, `docs/INBOX.md` acts as a middle-man "cached" state of the system.
1. **Stale Information:** If a task status changes, the inbox becomes stale until `arch inbox` (or `arch govern`) is run again.
2. **Editing Friction:** Humans must manually edit a Markdown file to approve or redirect tasks, which is slow and error-prone.
3. **Redundancy:** Much of the information in `INBOX.md` is already available in task files or git logs.

The user suggests that a static file is a "bad idea" for an interactive coordination mechanism.


### Definition of Done
- [ ] All ACs checked.
- [ ] arch review passes.
