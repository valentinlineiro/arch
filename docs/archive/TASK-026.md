## TASK-026: Implementación v0.2 — agentes, vocabulario y estructura
**Meta:** P0 | L | DONE | Sprint 2 | 6-writing | claude-code | docs/TASK-FORMAT.md, docs/GUIDELINES.md
**Depends:** TASK-023, TASK-024

### Acceptance Criteria
- [x] `docs/agents/THINK.md` creado: 2 fases secuenciales (system check → ideas), sin mezcla de contextos
- [x] `docs/agents/DO.md` creado: fusión de EXEC + HUMAN con operaciones diferenciadas por intent
- [x] `docs/agents/CONDUCTOR.md`, `EXEC.md`, `HUMAN.md`, `REFINE.md` eliminados o marcados deprecated
- [x] `arch.config.json` schema definido con campos de routing equivalentes a ROUTING.md actual
- [x] `ROUTING.md` eliminado, referencias actualizadas a `arch.config.json`
- [x] `docs/REFINEMENT.md` eliminado, instrucciones de IDEA actualizadas en BACKLOG y DO.md
- [x] `DONE.md`: columna `Iterations` añadida
- [x] `GUIDELINES.md`: tabla changelog añadida (solo cambios aditivos)
- [x] Symlinks `AGENTS.md`, `CLAUDE.md`, `GEMINI.md` en raíz apuntando a `docs/AGENTS.md`
- [x] `docs/AGENTS.md` actualizado como entrada universal con los 3 modos (THINK, DO, RETRO)
- [x] `CLAUDE.md` (raíz o symlink) actualizado para reflejar los nuevos modos

### Definition of Done
- [x] PR approved
- [x] `arch validate` pasa en el repo tras la implementación
- [x] Onboarding manual verificado: repo limpio + AGENTS.md → flujo completo funciona