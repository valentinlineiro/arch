## TASK-048: Detectar worktree sucio y drift task/archive en arch review
**Meta:** P1 | S | REVIEW | Focus:yes | 2-code-generation | claude-code | cli/src/, docs/agents/THINK.md, docs/agents/DO.md, docs/guidelines/
**Depends:** none

### Acceptance Criteria
- [x] `arch review` o el protocolo THINK/DO detecta worktree sucio por borrados rastreados y archivos temporales raíz relevantes
- [x] El sistema detecta inconsistencia cuando una misma tarea existe en `docs/tasks/` y `docs/archive/` en estado inválido
- [x] La salida clasifica claramente artefactos runtime ignorables vs drift real del repo
- [x] La regla queda documentada en la guía o protocolo correspondiente

### Definition of Done
- [x] Check determinístico implementado o protocolo actualizado
- [x] Sin falsos positivos obvios sobre cambios humanos intencionales
- [ ] PR aprobado
