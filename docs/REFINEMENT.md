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
**Status:** `PROMOTED`
**Idea:** Rediseño completo del framework para reducir complejidad de adopción y mantenimiento.
**Context:** v0.1 creció a 20 archivos, 5 agentes y 8 comandos CLI. La fricción de onboarding es alta. v0.2 propone colapsar hacia 9 archivos, 3 modos y 4 comandos.
**Key Requirements:**
- **Modos:** 5 agentes → 3 modos (THINK = conductor+refine fusionados en 2 fases secuenciales, DO = exec+human fusionados, RETRO sin cambios)
- **THINK fase 1:** system check — lee SPRINT + DONE solamente. **Fase 2:** ideas — lee BACKLOG status IDEA solamente. Si no hay IDEAs, fase 2 no corre. No se mezclan.
- **Routing:** `ROUTING.md` → `arch.config.json` (machine-readable). CLI valida via `arch validate`.
- **Symlinks:** `AGENTS.md`, `CLAUDE.md`, `GEMINI.md` en raíz apuntan a `docs/AGENTS.md`
- **DISPATCH:** output a terminal — excepción explícita a ADR-001. Estado real vive en SPRINT/BACKLOG. DISPATCH era conveniencia, no fuente de verdad. Documentado en ADR-003.
- **REFINEMENT.md:** eliminada — ideas con status `IDEA` inline en BACKLOG.
- **Vocabulario extendido:** `IDEA → READY → IN_PROGRESS → REVIEW → DONE | BLOCKED | REJECTED`. IDEA existe solo en BACKLOG; no entra a SPRINT hasta promoción explícita.
- **ADR:** opcional vía `arch add adr`.
- **Formato tarea:** 8 campos → 3 líneas (spec formal con regex — bloqueante).
- **CLI:** 8 comandos → 4 comandos (incluye `arch validate`).
- **DONE.md:** +columna Iterations. **GUIDELINES.md:** +tabla changelog. Solo cambios aditivos.
- **Migración:** `migrate-v2.sh` cubre v0.1→v0.2. Cerrado.
- **Kaizen aplicado:** TASK-018 resuelto en DO.md estructuralmente. TASK-021 resuelto (campo Committed eliminado). TASK-022 preservado (Evidence required en GUIDELINES).
**Implementation order (bloqueantes primero):**
1. ADR-003 — DISPATCH efímero (justifica excepción a ADR-001)
2. TASK: spec formato canónico de tarea + regex
3. TASK: `arch validate`
4. Implementación v0.2 (DO.md, THINK.md, vocabulario, estructura de archivos)

### 2. Status vocabulary refinement
**Status:** `DRAFT`
**Idea:** Asegurar que todos los agentes (CONDUCTOR, EXEC, HUMAN, etc.) usen los campos de estado de forma consistente.
**Context:** Tareas recientes (TASK-013, TASK-016) han tocado el manejo de estados. Necesitamos una "fuente de verdad" única.

### 4. TASK-017 (re-refining): DISPATCH.md staleness — Last-invalidated protocol
**Status:** `REJECTED`
**Rejected-reason:** Validated via arch validate (TASK-025) and ephemeral DISPATCH (ADR-003)

## Refinement history (Last 5)

| Date | Title | Outcome |
|------|-------|---------|
| 2026-04-24 | TASK-017 (staleness protocol) | Rejected |
| 2026-04-24 | ARCH v0.2 — Simplificación arquitectónica mayor | Promoted to TASK-023, TASK-024, TASK-025, TASK-026 |
| 2026-04-23 | CONDUCTOR — Evidence: required on all DISPATCH actions | Promoted to TASK-022 |
| 2026-04-23 | Remove Committed: field — git-derived commit count | Promoted to TASK-021 |
| 2026-04-23 | EXEC commit prefix validation | Promoted to TASK-019 + TASK-020 |
