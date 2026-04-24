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

### 3. ARCH v0.2 — Simplificación arquitectónica mayor
**Status:** `DRAFT`
**Idea:** Rediseño completo del framework para reducir complejidad de adopción y mantenimiento.
**Context:** v0.1 creció a 20 archivos, 5 agentes y 8 comandos CLI. La fricción de onboarding es alta. v0.2 propone colapsar hacia 9 archivos, 3 modos y 4 comandos.
**Key Requirements:**
- **Modos:** 5 agentes → 3 modos (THINK = conductor+refine fusionados, DO = exec+human fusionados, RETRO sin cambios)
- **Routing:** `ROUTING.md` → `arch.config.json` (machine-readable, sirve a todos los CLIs)
- **Symlinks:** `AGENTS.md`, `CLAUDE.md`, `GEMINI.md` en raíz del repo apuntan a `docs/AGENTS.md`
- **DISPATCH:** output directo a terminal en lugar de archivo persistente
- **REFINEMENT.md:** eliminada — ideas capturadas con status `IDEA` inline en `BACKLOG.md`
- **ADR:** opcional vía `arch add adr` en lugar de instalado por defecto
- **Formato tarea:** 8 campos → 3 líneas (meta comprimida)
- **CLI:** 8 comandos → 4 comandos
**Delta de archivos:**
```
v0.1: 20 archivos | v0.2: 9 archivos
docs/agents/: CONDUCTOR, EXEC, HUMAN, REFINE, RETRO → THINK, DO, RETRO
docs/REFINEMENT.md → eliminada
docs/ROUTING.md → arch.config.json (raíz)
```
**Riesgo principal:** backward compatibility del formato de tarea y migración de repos existentes.
**Precondición sugerida:** ADR antes de implementar — decisión de diseño con impacto global.

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
