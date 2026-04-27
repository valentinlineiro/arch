## TASK-042: bug: versión desincronizada entre arch.config.json y package.json
**Meta:** P0 | XS | DONE | Sprint 3 | 7-operations | human | arch.config.json
**Depends:** none

### Acceptance Criteria
- [x] Sincronizar versión: fuente de verdad = arch.config.json (v0.2.0). package.json bumpeado a v0.2.0.
- [x] `arch review` pasa sin WARN de Version tras el cambio

### Definition of Done
- [x] `arch review` Version: OK
- [x] PR aprobado
