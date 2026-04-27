## TASK-045: arch-viewer.html — lectura anónima de tareas via GitHub API
**Meta:** P2 | M | IN_PROGRESS | Focus:yes | 2-code-generation | claude-code | docs/
**Depends:** TASK-032

### Acceptance Criteria
- [x] Crear `docs/arch-viewer.html` — single HTML file, sin framework
- [x] Lectura de tareas desde `docs/tasks/` vía GitHub API anónima, interpretando `Focus: yes/no`
- [x] Muestra estado, prioridad, tamaño y título de cada tarea
- [x] Sección Drift: muestra el output de `arch review` (Commands / Version / Paths)
- [x] Maneja rate-limit anónimo con mensaje claro al usuario
- [ ] Publicado en GitHub Pages desde `docs/`

### Definition of Done
- [ ] HTML funcional con lectura anónima
- [ ] PR aprobado
