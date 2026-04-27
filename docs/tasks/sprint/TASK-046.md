## TASK-046: arch-viewer.html — edición de estado con GitHub OAuth
**Meta:** P2 | M | READY | Sprint 3 | 2-code-generation | claude-code | docs/
**Depends:** TASK-045

### Acceptance Criteria
- [ ] Añadir GitHub OAuth sign-in a `docs/arch-viewer.html` (GitHub Apps o token personal)
- [ ] Con sesión activa: permitir cambiar estado de tareas (READY → IN_PROGRESS → DONE) via GitHub API
- [ ] Sin sesión: modo lectura (comportamiento de TASK-045 sin cambios)
- [ ] El cambio de estado escribe en el archivo .md del repo via GitHub API (Contents API)

### Definition of Done
- [ ] HTML funcional con edición autenticada sobre TASK-045
- [ ] PR aprobado
