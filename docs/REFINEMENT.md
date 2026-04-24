# REFINEMENT.md
<!-- Ideas being refined before entering BACKLOG -->
<!-- Multiple ideas allowed. Use status tags to track progress. -->

## Refinement Queue
### 8. README — Real-world Case Study (Sprint 1)
**Status:** 
**Idea:** Update the main README to reflect actual project metrics and the iterative process experienced during ARCH's bootstrapping, including visual evidence from the git history.
**Context:** Show the framework's effectiveness in preventing drift and managing pivots using Sprint 1 data.
**Key Requirements:**
- **Visual Git Log:** Inclusion of a curated git log snippet showing atomic commits and TASK-ID tagging.
- **Pivot Analysis:** Practical example of the Python -> TypeScript transition as proof of Refinement value.
- **Metrics Table:** Real data (27 tasks, 3 ADRs, 3 Kaizens).
- **Gatekeeping Example:** Showing how the deterministic REVIEWER engine enforces GUIDELINES.md.

### 7. Task Files & Markdown Indexes (v0.3 Architecture)
**Status:** 
**Idea:** Moving tasks to individual files () and using / as lightweight indexes.
**Context:** Address the growing size of status files and facilitate archiving while maintaining context efficiency (ADR-002).
**Key Requirements:**
- **Index/Detail Split:**  and  contain only stubs (ID, Title, Meta, Link).
- **Task Files:** Full task definition lives in its own Markdown file.
- **Migration Script:** Automation to extract existing tasks without data loss.
- **CLI Validation:** Ensure index and details remain synchronized.

### 1. RETRO — Guardián de la Arquitectura (Análisis de Log)
**Status:** 
**Idea:** Expand RETRO to act as an architecture integrity auditor.
**Gaps:**
- [ ] **Enforcement:** Should it block commits (git hooks) or just report?
- [ ] **Detection:** Compare diff against task  to detect out-of-scope changes.
- [ ] **Remediation:** Define clear templates for 'Process Fix' tasks.

### 3. ARCH v0.2 — Simplificación arquitectónica mayor
**Status:** `PROMOTED`
**Idea:** Rediseño completo del framework para reducir complejidad de adopción y mantenimiento.
**Context:** v0.1 creció a 20 archivos, 5 agentes y 8 comandos CLI. La fricción de onboarding es alta. v0.2 propone colapsar hacia 9 archivos, 3 modos y 4 comandos.
**Key Requirements:
- **Zero external dependencies:** Use only Node.js standard library to keep it fast and portable.**
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
**Status:** 
**Reason:** Superseded by canonical specification in  (TASK-024).

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
