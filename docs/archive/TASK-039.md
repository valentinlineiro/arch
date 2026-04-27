## TASK-039: Crear y publicar arch-viewer.html conectado a GitHub API
**Meta:** P2 | L | REJECTED | Backlog | 2-code-generation | claude-code | docs/
**Depends:** TASK-032

### Acceptance Criteria
- [ ] Crear `docs/arch-viewer.html` — single HTML file, sin framework
- [ ] Sin sesión: lectura de tareas vía GitHub API (rate-limit anónimo aplica)
- [ ] Con sesión (GitHub OAuth): escritura de estado de tareas (READY/IN_PROGRESS/DONE)
- [ ] GitHub OAuth sign-in implementado con flujo estándar de GitHub Apps o token personal
- [ ] Integración visual con TASK-032 (mostrar sección Drift del sistema)
- [ ] Publicado en GitHub Pages desde `docs/`

### Definition of Done
- [ ] HTML funcional con lectura anónima y edición autenticada
- [ ] PR aprobado
