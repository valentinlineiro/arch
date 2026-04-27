## TASK-047: Migrar sprint/backlog a docs/tasks/ único con campo Focus
**Meta:** P1 | M | DONE | Focus:yes | 2-code-generation | claude-code | docs/tasks/, cli/src/, docs/AGENTS.md
**Depends:** ADR-004

### Acceptance Criteria
- [x] Crear `docs/tasks/` como directorio único — fusionar contenido de `docs/tasks/sprint/` y `docs/tasks/backlog/`
- [x] Añadir campo `Focus: yes/no` a la línea Meta de cada tarea activa (`yes` = antes en sprint, `no` = antes en backlog)
- [x] Formato Meta actualizado: `P1 | S | READY | Focus:yes | 6-writing | claude | docs/`
- [x] CLI (`MarkdownTaskRepository`) actualizado para leer desde `docs/tasks/` y filtrar por `Focus`
- [x] `arch status` muestra tareas Focus:yes como activas y Focus:no como pendientes
- [x] `docs/AGENTS.md` y `docs/agents/DO.md` actualizados — eliminar referencias a sprint/ y backlog/ como directorios
- [x] `arch.config.json` paths actualizados si aplica
- [x] `arch review` Drift:Paths pasa sin WARNs tras la migración

### Definition of Done
- [x] Todos los tasks migrados al nuevo formato
- [x] CLI funcional con nueva estructura
- [x] `arch review`: OK
- [x] PR aprobado
