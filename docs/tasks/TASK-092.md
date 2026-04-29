## TASK-092: arch status - sprint progress view
**Meta:** P2 | S | 7 | REVIEW | Focus:yes | 2-code-generation | claude | cli/src/main/ts/application/commands/status-command.ts
**Depends:** TASK-091
**Locked-by:** codex | **Locked-at:** 2026-04-29T08:34:37Z

### Acceptance Criteria
- [x] `arch status` displays a sprint section showing the current sprint name (from `arch.config.json`) and progress: `N/M tasks done`.
- [x] Tasks belonging to the current sprint are identified by their `Sprint:` field matching `currentSprint`.
- [x] If no sprint is active, the sprint section is omitted.
- [x] `arch review` passes.

### Definition of Done
- [x] All ACs checked.
- [x] `arch review` passes.
