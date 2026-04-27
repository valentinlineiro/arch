## TASK-059: Crear arch-upgrade.html para migración de versiones
**Meta:** P2 | S | READY | Focus:no | 2-code-generation | local | docs/
**Depends:** none

### Acceptance Criteria
- [ ] Crear `docs/arch-upgrade.html` — single HTML file, sin framework
- [ ] Implementar funcionalidad de pegado de JSON local y fetch del template remoto desde GitHub main
- [ ] Implementar motor de diff visual simple en JS para resaltar cambios en `arch.config.json`
- [ ] Generar sugerencias de migración basadas en los campos detectados
- [ ] Integrar estéticamente con el diseño ARCH (dark mode)

### Definition of Done
- [ ] Herramienta funcional en `docs/`
- [ ] Capaz de detectar cambios entre v0.3 y v0.4
- [ ] PR aprobado
