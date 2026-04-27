# Bug & Hotfix Protocol

## Definición de bug en ARCH

Un bug es **cualquier desajuste detectado en el sistema**, incluyendo:

- WARNs reportados por `arch review` (drift de comandos, versión, paths)
- Inconsistencias entre documentación y comportamiento real del CLI
- Referencias rotas en `AGENTS.md` u otros protocolos
- Tareas archivadas con ACs sin completar

## Flujo de bug

1. **Detección:** `arch review` o THINK mode identifica el desajuste.
2. **Registro:** El agente crea la tarea de bug directamente en `docs/tasks/sprint/` — no pasa por backlog.
3. **Priorización:** Los bugs siempre tienen prioridad sobre tareas de desarrollo. Se atienden antes de continuar con features.
4. **Resolución:** Flujo DO normal — IN_PROGRESS → implementar → DONE → archivar.

## Clasificación de severidad

| Nivel | Criterio | Ejemplo |
|-------|----------|---------|
| P0 | Bloqueante para el agente — impide operar correctamente | Path roto en AGENTS.md, arch review devuelve exit 1 |
| P1 | Degradado funcional — el sistema opera pero con fricción | Comando documentado en README sin implementar |
| P2 | Cosmético / warn — no afecta operación | Inconsistencia menor de formato |

## Relación con `arch review`

Cada WARN de `arch review` es un bug. Al detectarlos durante THINK o DO, el agente crea la tarea correspondiente en sprint con la severidad apropiada.

Los bugs P0 se marcan IN_PROGRESS en el mismo commit en que se crean.
