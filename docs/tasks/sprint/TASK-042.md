## TASK-042: bug: versión desincronizada entre arch.config.json y package.json
**Meta:** P0 | XS | READY | Sprint 3 | 7-operations | human | arch.config.json
**Depends:** none

### Acceptance Criteria
- [ ] Sincronizar versión: decidir cuál es la fuente de verdad (package.json) y actualizar `arch.config.json` a v0.1.0, o bumpearlo ambos a v0.2.0
- [ ] `arch review` pasa sin WARN de Version tras el cambio

### Definition of Done
- [ ] `arch review` Version: OK
- [ ] PR aprobado
