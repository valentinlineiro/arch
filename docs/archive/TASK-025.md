## TASK-025: CLI — arch validate
**Meta:** P0 | M | DONE | Sprint 2 | 2-code-generation | claude-code | docs/TASK-FORMAT.md
**Depends:** TASK-024

### Acceptance Criteria
- [x] `arch validate` disponible como subcomando del CLI
- [x] Valida `arch.config.json` contra schema definido (campos requeridos, tipos, valores permitidos)
- [x] Valida que SPRINT.md y BACKLOG.md tengan tareas en formato v0.2 (usando regex de TASK-FORMAT.md)
- [x] Output: lista de errores con archivo + línea, o "OK" si todo válido
- [x] Exit code 1 si hay errores, 0 si válido
- [x] Tests unitarios para al menos 3 casos de error y el caso happy path

### Definition of Done
- [x] PR aprobado
- [x] `arch validate` documentado en README o help text del CLI