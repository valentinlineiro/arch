## TASK-046: arch-viewer.html — edición de estado con GitHub OAuth
**Meta:** P2 | M | DONE | Focus:yes | 2-code-generation | claude-code | docs/
**Depends:** TASK-045

### Acceptance Criteria
- [x] Añadir GitHub OAuth sign-in a `docs/arch-viewer.html` (vía Personal Access Token)
- [x] Con sesión activa: permitir cambiar estado de tareas (READY → IN_PROGRESS → DONE) via GitHub API
- [x] Sin sesión: modo lectura (comportamiento de TASK-045 sin cambios)
- [x] El cambio de estado escribe en el archivo .md del repo via GitHub API (Contents API)

### Definition of Done
- [x] HTML funcional con edición autenticada sobre TASK-045
- [ ] PR aprobado
