## TASK-010: Build `arch` CLI (project interaction layer)
**Meta:** P0 | M | 5 | DONE | Sprint 1 | 2-code-generation | codex | scripts/arch-install.sh, TASK-004
**Depends:** TASK-004

### Acceptance Criteria
- [x] `arch conduct` — invokes CONDUCTOR mode via Claude
- [x] `arch exec [TASK-ID]` — invokes EXEC mode for given task (or next READY if no ID)
- [x] `arch refine` — invokes REFINE mode against REFINEMENT.md
- [x] `arch retro` — invokes RETRO mode to close sprint
- [x] `arch human` — invokes HUMAN mode for natural language interaction
- [x] `arch status` — prints DISPATCH.md content to terminal
- [x] `arch task done ID` — marks task DONE without opening Claude
- [x] `arch task start ID` — marks task IN_PROGRESS without opening Claude
- [x] `arch` command available after `npx arch-init` (bundled in same package)

### Definition of Done
- [x] All commands working on macOS, Linux, Windows (WSL)
- [x] PR approved + CI green