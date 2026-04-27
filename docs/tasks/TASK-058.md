## TASK-058: System Hardening — Anti-drift and strict criteria
**Meta:** P2 | S | READY | Focus:no | 7-operations | local | cli/, arch.config.json, docs/
**Depends:** TASK-056

### Acceptance Criteria
- [ ] Eliminar rutas muertas (`sprint`, `backlog`, `done`) de `arch.config.json`
- [ ] Implementar validación de existencia de rutas en `arch review` (si está en config, debe existir en disco)
- [ ] Implementar validación estricta de ACs: `arch review` advierte si una tarea está en `DONE` o `REVIEW` pero tiene cajas `[ ]` sin marcar
- [ ] Sincronizar versión de todos los docs (`AGENTS.md`, `ONBOARDING.html`) para que lean de `arch.config.json` (o eliminar hardcodeo)

### Definition of Done
- [ ] CLI reconstruido con nuevas validaciones
- [ ] `arch review` detecta proactivamente inconsistencias de ACs y rutas
- [ ] PR aprobado
