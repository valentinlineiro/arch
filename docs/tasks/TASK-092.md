## TASK-092: arch status - sprint progress view
**Meta:** P2 | S | READY | Focus:no | 2-code-generation | claude | cli/src/main/ts/application/commands/status-command.ts
**Depends:** TASK-091

### Acceptance Criteria
- [ ] `arch status` displays a sprint section showing the current sprint name (from `arch.config.json`) and progress: `N/M tasks done`.
- [ ] Tasks belonging to the current sprint are identified by their `Sprint:` field matching `currentSprint`.
- [ ] If no sprint is active, the sprint section is omitted.
- [ ] `arch review` passes.

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
