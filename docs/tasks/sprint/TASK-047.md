## TASK-047: Migrar sprint/backlog a docs/tasks/ único con campo Focus
**Meta:** P1 | M | IN_PROGRESS | Sprint 3 | 2-code-generation | claude-code | docs/tasks/, cli/src/, docs/AGENTS.md
**Depends:** ADR-004

### Acceptance Criteria
- [ ] Crear `docs/tasks/` como directorio único — fusionar contenido de `docs/tasks/sprint/` y `docs/tasks/backlog/`
- [ ] Añadir campo `Focus: yes/no` a la línea Meta de cada tarea activa (`yes` = antes en sprint, `no` = antes en backlog)
- [ ] Formato Meta actualizado: `P1 | S | READY | Focus:yes | 6-writing | claude | docs/`
- [ ] CLI (`MarkdownTaskRepository`) actualizado para leer desde `docs/tasks/` y filtrar por `Focus`
- [ ] `arch status` muestra tareas Focus:yes como activas y Focus:no como pendientes
- [ ] `docs/AGENTS.md` y `docs/agents/DO.md` actualizados — eliminar referencias a sprint/ y backlog/ como directorios
- [ ] `arch.config.json` paths actualizados si aplica
- [ ] `arch review` Drift:Paths pasa sin WARNs tras la migración

### Definition of Done
- [ ] Todos los tasks migrados al nuevo formato
- [ ] CLI funcional con nueva estructura
- [ ] `arch review`: OK
- [ ] PR aprobado
