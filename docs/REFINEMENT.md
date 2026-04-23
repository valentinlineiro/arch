# REFINEMENT.md
<!-- Ideas being refined before entering BACKLOG -->
<!-- Multiple ideas allowed. Use status tags to track progress. -->

## Refinement Queue

### 1. RETRO — Guardián de la Arquitectura (Análisis de Log)
**Status:** `DRAFT`
**Idea:** Expandir RETRO para que actúe como auditor de la integridad del framework.
**Context:** Necesitamos que el sistema se auto-corrija. Si el git log muestra que nos saltamos pasos (PRs, atomicidad), RETRO debe detectarlo y proponer tareas de "Arreglo de Proceso".
**Key Requirements:**
- Análisis de `git log` limitado estrictamente al periodo del sprint actual.
- Detección de falta de atomicidad (commits que mezclan TASK-IDs o afectan sistemas no declarados).
- Identificación de "fricción arquitectónica" (donde la fluidez del desarrollo se ve comprometida por el framework).
- Generación de propuestas automáticas en este mismo archivo (`REFINEMENT.md`).

### 2. Status vocabulary refinement
**Status:** `DRAFT`
**Idea:** Asegurar que todos los agentes (CONDUCTOR, EXEC, HUMAN, etc.) usen los campos de estado de forma consistente.
**Context:** Tareas recientes (TASK-013, TASK-016) han tocado el manejo de estados. Necesitamos una "fuente de verdad" única.

## Refinement history (Last 5)

| Date | Title | Outcome |
|------|-------|---------|
| 2026-04-23 | CONDUCTOR — Evidence: required on all DISPATCH actions | Promoted to TASK-022 |
| 2026-04-23 | Remove Committed: field — git-derived commit count | Promoted to TASK-021 |
| 2026-04-23 | EXEC commit prefix validation | Promoted to TASK-019 + TASK-020 |
| 2026-04-23 | HUMAN agent — duplicate detection before task creation | Promoted to TASK-018 |
| 2026-04-23 | DISPATCH.md staleness — Last-invalidated protocol | Promoted to TASK-017 |
