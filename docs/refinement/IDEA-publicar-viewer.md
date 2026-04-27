# IDEA: publicar arch-viewer.html conectado a GitHub API en docs/
**Created:** 2026-04-26
**Source:** Human request via Manus
**Status:** DECIDED

## Proposal
publicar arch-viewer.html conectado a GitHub API en docs/

## Gaps
- **Permisos:** La API de GitHub tiene límites de rate-limit para peticiones no autenticadas.
- **Visualización:** ¿Debe renderizar diagramas Mermaid/D2 presentes en el repo?
- **Alcance:** ¿Solo lectura de tareas o también edición básica de estados (READY/DONE)?
- **Dependencia:** TASK-032 (Drift detection) podría integrarse aquí visualmente.

## Decision
Incluye edición de estado de tareas (READY/IN_PROGRESS/DONE) con GitHub OAuth sign-in para autenticación y escritura via API. Solo lectura sin sesión. El HTML debe crearse antes de publicarlo.
PROMOTE → BACKLOG
