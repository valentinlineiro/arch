## TASK-889: `arch task edit` — Interactive Metadata Management
**Meta:** P1 | S | READY | Focus:no | 2-code-generation | local | cli/src/main/ts/
**Depends:** none

### Acceptance Criteria
- [ ] `arch task edit TASK-XXX` subcommand added to `TaskCommand`.
- [ ] CLI reads the current task and displays each editable meta field (priority, size, status, class, context) with its current value.
- [ ] User input is validated against `TaskValidator` before any file is written.
- [ ] On success, the task file is updated with a correctly formatted meta line and committed with `chore: [TASK-889] update metadata for TASK-XXX`.
- [ ] `arch review` passes after the edit.

### Context
#### Problem
The `**Meta:**` line in ARCH tasks is a high-discipline regex-based string. Manually editing it (e.g., changing `P2` to `P1` or updating `Context`) is brittle and often causes `arch review` failures due to formatting errors.

#### Solution
Implement `arch task edit TASK-XXX` as an interactive CLI command.

**Workflow:**
1.  `arch task edit TASK-064`
2.  CLI displays current values and prompts for changes:
    - Priority (P0-P3)
    - Size (XS-XL)
    - Status (READY, BLOCKED, etc.)
    - Class (Select from registry)
    - Context (Comma-separated paths)
3.  CLI validates the new values against the `TaskValidator`.
4.  CLI updates the file directly and commits the change with a `chore: update metadata for TASK-XXX` message.

### Definition of Done
- [ ] All ACs checked.
- [ ] arch review passes.
