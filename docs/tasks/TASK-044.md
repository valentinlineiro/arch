## TASK-044: Crear y publicar ONBOARDING.html en GitHub Pages
**Meta:** P2 | M | IN_PROGRESS | Focus:yes | 2-code-generation | claude-code | docs/
**Depends:** none

### Acceptance Criteria
- [x] Crear `docs/ONBOARDING.html` — single HTML file, sin framework
- [x] Flujo interactivo: el HTML pregunta al usuario sus requisitos funcionales del proyecto (nombre, tipo, stack, agentes a usar) y genera un resumen de onboarding personalizado
- [x] Contenido base sincronizado con `docs/AGENTS.md` (modos THINK/DO, protocolo de tareas, comandos CLI)
- [ ] GitHub Actions configurado para publicar `docs/` en GitHub Pages automáticamente en cada push a main
- [ ] Accesible en `https://valentinlineiro.github.io/arch/ONBOARDING.html`

### Definition of Done
- [ ] HTML funcional en GitHub Pages
- [ ] GitHub Action corriendo en el repo
- [ ] PR aprobado
