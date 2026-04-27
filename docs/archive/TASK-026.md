## TASK-026: v0.2 implementation - agents, vocabulary, and structure
**Meta:** P0 | L | DONE | Sprint 2 | 6-writing | claude-code | docs/TASK-FORMAT.md, docs/GUIDELINES.md
**Depends:** TASK-023, TASK-024

### Acceptance Criteria
- [x] `docs/agents/THINK.md` created: 2 sequential phases (system check → ideas), no context mixing
- [x] `docs/agents/DO.md` created: merge of EXEC + HUMAN with intent-differentiated operations
- [x] `docs/agents/CONDUCTOR.md`, `EXEC.md`, `HUMAN.md`, `REFINE.md` deleted or marked deprecated
- [x] `arch.config.json` schema defined with routing fields equivalent to current ROUTING.md
- [x] `ROUTING.md` deleted, references updated to `arch.config.json`
- [x] `docs/REFINEMENT.md` deleted, IDEA instructions updated in BACKLOG and DO.md
- [x] `DONE.md`: `Iterations` column added
- [x] `GUIDELINES.md`: changelog table added (additive changes only)
- [x] Symlinks `AGENTS.md`, `CLAUDE.md`, `GEMINI.md` at root pointing to `docs/AGENTS.md`
- [x] `docs/AGENTS.md` updated as universal entry point with 3 modes (THINK, DO, RETRO)
- [x] `CLAUDE.md` (root or symlink) updated to reflect new modes

### Definition of Done
- [x] PR approved
- [x] `arch validate` passes in repo after implementation
- [x] Manual onboarding verified: clean repo + AGENTS.md → full flow works