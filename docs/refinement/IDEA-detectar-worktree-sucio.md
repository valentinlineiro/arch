# IDEA: Detectar worktree sucio y artefactos temporales antes de THINK o DO
**Created:** 2026-04-27
**Source:** Human request via THINK mode
**Status:** DECIDED
**Meta:** P1 | XS | claude | docs/AGENTS.md, docs/agents/THINK.md, docs/agents/DO.md, cli/src/

## Problema
El worktree puede quedar sucio por artefactos temporales o estados inconsistentes entre tareas activas y archivo histórico. Eso mete ruido en THINK/DO, dificulta distinguir cambios intencionales de basura local y puede esconder drift real.

## Solución propuesta
Añadir una verificación de higiene del worktree al protocolo y, si encaja, al CLI. El sistema debe detectar:
- archivos temporales o vacíos no versionados en la raíz
- borrados de archivos rastreados no intencionales
- inconsistencias entre `docs/tasks/` y `docs/archive/` para una misma tarea

La salida inicial puede ser un `WARN` determinístico en `arch review` o un paso explícito de preflight en `THINK`/`DO`.

## Dependencias
Ninguna técnica estricta. Puede reutilizar la infraestructura existente de `arch review` y drift checks.

## Tamaño estimado
XS — si v1 es solo detección y guideline. S si también añade enforcement en CLI.

## Gaps
- **Severidad:** decidir si un worktree sucio bloquea la sesión o solo emite `WARN`
- **Scope:** definir qué se considera artefacto temporal vs cambio legítimo no committeado
- **Repos sucios por diseño:** aclarar cómo convivir con cambios humanos deliberados sin generar falsos positivos
- **Task/archive drift:** decidir si una tarea no puede existir a la vez en `docs/tasks/` y `docs/archive/`, o si hay estados transitorios permitidos
- **Ubicación del check:** protocolo solamente, `arch review`, o ambos

## Decision
Promover la idea como guardrail de higiene del repo con foco en detección, no auto-remediación.
PROMOTE → TASK-048
