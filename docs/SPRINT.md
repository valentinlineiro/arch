# SPRINT.md
<!-- Sprint 1 — ARCH bootstrapping -->

## Sprint 1
**Period:** 2026-04-23 → 2026-05-07
**Goal:** ARCH is public, documented with ADRs, and installable via npx
**Committed:** 10 tasks
**Velocity target:** — (first sprint, no baseline)

---

## Active tasks

## TASK-001: Publish repo to GitHub as public OSS
**Meta:** P0 | S | DONE | Sprint 1
**Class:** 7-operations
**CLI:** human
**CLI-reason:** requires account setup — not automatable
**Context-budget:** README.md only
**Depends:** none

### Acceptance Criteria
- [x] Repo live at github.com/valentinlineiro/arch
- [x] README renders correctly
- [x] License: MIT confirmed
- [x] Symlinks work after clone
- [x] arch-install.sh updated with real GitHub URL

### Definition of Done
- [x] Repo public and accessible
- [x] arch-install.sh points to real raw.githubusercontent.com URL

---

## TASK-002: Write ADR-001 — Why git as the operating system
**Meta:** P1 | S | DONE | Sprint 1
**Class:** 6-writing
**CLI:** claude
**CLI-reason:** architectural rationale, trade-off analysis
**Context-budget:** agents/EXEC.md + this task + docs/adr/ADR-000-template.md
**Depends:** none

### Acceptance Criteria
- [x] Covers: alternatives considered (SaaS DB, local DB, flat files)
- [x] Covers: why git wins (auditability, anti-collision, universality)
- [x] Covers: consequences (no real-time collab, merge conflicts as feature)
- [x] Under 400 tokens total

### Definition of Done
- [x] PR approved
- [x] File: docs/adr/ADR-001-git-as-operating-system.md

---

## TASK-003: Write ADR-002 — Why context is a budget not a default
**Meta:** P1 | S | DONE | Sprint 1
**Class:** 6-writing
**CLI:** claude
**CLI-reason:** architectural rationale
**Context-budget:** agents/EXEC.md + this task + docs/adr/ADR-000-template.md
**Depends:** TASK-002

### Acceptance Criteria
- [x] Covers: cost of loading full context on every invocation
- [x] Covers: the context-budget field in task format
- [x] Covers: measured token reduction (~75%)
- [x] Under 400 tokens total

### Definition of Done
- [x] PR approved
- [x] File: docs/adr/ADR-002-context-as-budget.md

---

## TASK-004: Build npx arch-init (remote installer)
**Meta:** P1 | M | DONE | Sprint 1
**Class:** 2-code-generation
**CLI:** codex
**CLI-reason:** standard Node.js CLI scaffolder
**Context-budget:** agents/EXEC.md + this task + scripts/arch-install.sh
**Depends:** TASK-001

### Acceptance Criteria
- [x] `npx arch-init my-project` creates full ARCH structure
- [x] `npx arch-init .` installs into current directory
- [x] Downloads from GitHub raw URLs
- [x] Creates symlinks post-download
- [x] Works on macOS, Linux, Windows (WSL)

### Definition of Done
- [x] Published to npm as `arch-init`
- [x] CI green

---

## TASK-005: Token audit — measure actual cost per mode
**Meta:** P1 | S | DONE | Sprint 1
**Class:** 5-research
**CLI:** claude
**CLI-reason:** requires reading all agent files + accurate token counting
**Context-budget:** agents/EXEC.md + this task + all docs/agents/*.md
**Depends:** none

### Acceptance Criteria
- [x] Actual token count per mode: CONDUCTOR, EXEC, REFINE, RETRO
- [x] Compare vs. declared budget in README
- [x] Flag protocols over budget by >20%
- [x] Propose reductions where needed

### Definition of Done
- [x] PR updating README token table with real numbers
- [x] Over-budget protocols patched in same PR

---

## TASK-023: ADR-003 — DISPATCH efímero (excepción a ADR-001)
**Meta:** P0 | XS | DONE | Sprint 1
**Class:** 8-strategy
**CLI:** claude
**CLI-reason:** decisión arquitectónica con impacto global — requiere juicio de diseño
**Context-budget:** agents/EXEC.md + this task + docs/adr/ADR-001-git-as-operating-system.md
**Depends:** none

### Acceptance Criteria
- [x] `docs/adr/ADR-003-dispatch-ephemeral.md` creado con formato estándar ADR
- [x] Documenta explícitamente la excepción a ADR-001: DISPATCH es output de conveniencia, no fuente de verdad
- [x] Justifica por qué el estado real vive en SPRINT/BACKLOG y DISPATCH es redundante
- [x] Declara consecuencias: pérdida de auditabilidad de recomendaciones vs. reducción de fricción
- [x] Status: ACCEPTED con deciders registrados

### Definition of Done
- [x] PR aprobado
- [x] ADR-003 enlazado desde GUIDELINES.md o AGENTS.md como referencia

---

## TASK-024: Spec formato canónico de tarea v0.2 + regex
**Meta:** P0 | S | DONE | Sprint 1

**Class:** 6-writing
**CLI:** claude
**CLI-reason:** spec formal con impacto en DO.md, THINK.md y arch validate — requiere consistencia cross-agent
**Context-budget:** agents/EXEC.md + this task + docs/GUIDELINES.md
**Depends:** TASK-023

### Acceptance Criteria
- [x] Documento `docs/TASK-FORMAT.md` creado con spec completa del formato v0.2 (3 líneas meta comprimida)
- [x] Regex o BNF incluida para cada campo obligatorio y opcional
- [x] Vocabulario de status extendido documentado: `IDEA → READY → IN_PROGRESS → DONE → DONE | BLOCKED | REJECTED`
- [x] Regla de IDEA: existe solo en BACKLOG, no entra a SPRINT hasta promoción explícita
- [x] Ejemplo de tarea v0.1 y equivalente v0.2 incluidos como referencia
- [x] Semver impact declarado

### Definition of Done
- [x] PR aprobado
- [x] GUIDELINES.md referencia TASK-FORMAT.md como fuente de verdad del formato

---

## TASK-025: CLI — arch validate
**Meta:** P0 | M | READY | Sprint 1
**Class:** 2-code-generation
**CLI:** claude-code
**CLI-reason:** implementación de comando CLI con lógica de validación — requiere manejo de errores y edge cases
**Context-budget:** agents/EXEC.md + this task + docs/TASK-FORMAT.md
**Depends:** TASK-024

### Acceptance Criteria
- [x] `arch validate` disponible como subcomando del CLI
- [x] Valida `arch.config.json` contra schema definido (campos requeridos, tipos, valores permitidos)
- [x] Valida que SPRINT.md y BACKLOG.md tengan tareas en formato v0.2 (usando regex de TASK-FORMAT.md)
- [x] Output: lista de errores con archivo + línea, o "OK" si todo válido
- [x] Exit code 1 si hay errores, 0 si válido
- [x] Tests unitarios para al menos 3 casos de error y el caso happy path

### Definition of Done
- [x] PR aprobado
- [x] `arch validate` documentado en README o help text del CLI

---

## TASK-026: Implementación v0.2 — agentes, vocabulario y estructura
**Meta:** P0 | L | READY | Sprint 1
**Class:** 6-writing
**CLI:** claude-code
**CLI-reason:** reestructuración de múltiples archivos de protocolo — requiere consistencia cross-file
**Context-budget:** agents/EXEC.md + this task + docs/TASK-FORMAT.md + docs/adr/ADR-003-dispatch-ephemeral.md + docs/GUIDELINES.md
**Depends:** TASK-023, TASK-024

### Acceptance Criteria
- [x] `docs/agents/THINK.md` creado: 2 fases secuenciales (system check → ideas), sin mezcla de contextos
- [x] `docs/agents/DO.md` creado: fusión de EXEC + HUMAN con operaciones diferenciadas por intent
- [x] `docs/agents/CONDUCTOR.md`, `EXEC.md`, `HUMAN.md`, `REFINE.md` eliminados o marcados deprecated
- [x] `arch.config.json` schema definido con campos de routing equivalentes a ROUTING.md actual
- [x] `ROUTING.md` eliminado, referencias actualizadas a `arch.config.json`
- [x] `docs/REFINEMENT.md` eliminado, instrucciones de IDEA actualizadas en BACKLOG y DO.md
- [x] `DONE.md`: columna `Iterations` añadida
- [x] `GUIDELINES.md`: tabla changelog añadida (solo cambios aditivos)
- [x] Symlinks `AGENTS.md`, `CLAUDE.md`, `GEMINI.md` en raíz apuntando a `docs/AGENTS.md`
- [x] `docs/AGENTS.md` actualizado como entrada universal con los 3 modos (THINK, DO, RETRO)
- [x] `CLAUDE.md` (raíz o symlink) actualizado para reflejar los nuevos modos

### Definition of Done
- [x] PR aprobado
- [x] `arch validate` pasa en el repo tras la implementación
- [x] Onboarding manual verificado: repo limpio + AGENTS.md → flujo completo funciona

---

## TASK-010: Build `arch` CLI (project interaction layer)
**Meta:** P0 | M | DONE | Sprint 1
**Class:** 2-code-generation
**CLI:** codex
**CLI-reason:** standard Node.js CLI implementation
**Context-budget:** agents/EXEC.md + this task + scripts/arch-install.sh + TASK-004
**Depends:** TASK-004

### Acceptance Criteria
- [x] `arch conduct` — invokes CONDUCTOR mode via Claude
- [x] `arch exec [TASK-ID]` — invokes EXEC mode for given task (or next READY if no ID)
- [x] `arch refine` — invokes REFINE mode against REFINEMENT.md
- [x] `arch retro` — invokes RETRO mode to close sprint
- [x] `arch human` — invokes HUMAN mode for natural language interaction
- [x] `arch status` — prints DISPATCH.md content to terminal
- [x] `arch task done ID` — marks task DONE without opening Claude
- [x] `arch task start ID` — marks task IN_PROGRESS without opening Claude
- [x] `arch` command available after `npx arch-init` (bundled in same package)

### Definition of Done
- [x] All commands working on macOS, Linux, Windows (WSL)
- [x] PR approved + CI green

---

## TASK-009: Add HUMAN agent to ARCH framework
**Meta:** P0 | S | DONE | Sprint 1
**Class:** 6-writing
**CLI:** claude
**CLI-reason:** requires editing framework files and maintaining protocol consistency
**Context-budget:** agents/EXEC.md + this task + docs/agents/HUMAN.md + CLAUDE.md + README.md
**Depends:** none

### Acceptance Criteria
- [x] `docs/agents/HUMAN.md` committed to repo
- [x] HUMAN mode added to `CLAUDE.md` (modes section, same structure as others)
- [x] README updated to document the HUMAN agent and its role

### Definition of Done
- [x] PR approved
- [x] HUMAN agent invocable from CLAUDE.md like any other mode

---

## TASK-013: Fix HUMAN agent — sync BACKLOG and SPRINT in one operation
**Meta:** P1 | S | DONE | Sprint 1
**Class:** 6-writing
**CLI:** claude
**CLI-reason:** protocol patch requires coherent prose and consistency across agent files
**Context-budget:** agents/EXEC.md + this task + docs/agents/HUMAN.md
**Depends:** none

### Acceptance Criteria
- [x] `docs/agents/HUMAN.md` "Mueve [tarea(s)] al sprint" operation updated to modify both BACKLOG.md and SPRINT.md atomically
- [x] Decision recorded: BACKLOG entry is updated (status field) or removed — one approach chosen and documented
- [x] Single commit covers both file changes (no two-step drift window)
- [x] Existing "After every operation" report section updated if status vocabulary changes

### Definition of Done
- [x] PR approved
- [x] No status-drift possible between BACKLOG.md and SPRINT.md after a "move to sprint" operation

---

## TASK-011: Maintain CHANGELOG
**Meta:** P2 | S | READY | Sprint 1
**Class:** 6-writing
**CLI:** claude
**CLI-reason:** backfill requires reading git history and writing coherent prose
**Context-budget:** agents/EXEC.md + this task + docs/agents/HUMAN.md + git log
**Depends:** none

### Acceptance Criteria
- [x] `CHANGELOG.md` created at repo root following Keep a Changelog format
- [x] Backfilled with all tasks completed to date (TASK-001, TASK-009)
- [x] HUMAN.md updated: task completion flow includes a changelog entry step
- [x] Future entries follow `## [Unreleased]` → versioned section pattern

### Definition of Done
- [x] PR approved
- [x] CHANGELOG.md present in repo root

---

## TASK-016: Mandatory EXEC Commits before REVIEW
**Meta:** P1 | S | DONE | Sprint 1
**Class:** 6-writing
**CLI:** claude
**CLI-reason:** protocol update requires coherent prose and consistency
**Context-budget:** agents/EXEC.md + this task
**Depends:** none

### Acceptance Criteria
- [x] `docs/agents/EXEC.md` updated to include a mandatory "Commit artifacts" step as the final action before changing status to `REVIEW`.
- [x] Protocol specifies that the commit message must include the TASK-ID.
- [x] Clarifies that the agent should stop after this commit.

### Definition of Done
- [x] PR approved
- [x] EXEC agent protocol reflects the new requirement.

---

## TASK-015: Update CONDUCTOR protocol — commit DISPATCH.md automatically
**Meta:** P2 | XS | DONE | Sprint 1
**Class:** 6-writing
**CLI:** claude
**CLI-reason:** protocol refinement requires coherent prose and consistency
**Context-budget:** agents/CONDUCTOR.md + this task
**Depends:** none

### Acceptance Criteria
- [x] `docs/agents/CONDUCTOR.md` updated to include "Commit DISPATCH.md" as the final step.
- [x] Defined commit message pattern: `chore: conductor dispatch [date]`
- [x] Protocol clarifies that CONDUCTOR still stops immediately after the commit.

### Definition of Done
- [x] PR approved
- [x] CONDUCTOR agent protocol reflects the new requirement.

---

## Sprint log

| Date | Event |
|------|-------|
| 2026-04-23 | Sprint 1 started — ARCH bootstrapped with ARCH |

---

## Blocked tasks
_None_

---

## TASK-022: Evidence required on THINK actions
**Meta:** P2 | XS | DONE | Sprint 1 | 6-writing | claude | docs/agents/THINK.md
**Depends:** TASK-026

### Acceptance Criteria
- [x] THINK.md protocol requires an 'Evidence:' line for every action emitted.
- [x] 'Evidence:' must cite a concrete signal (e.g., 'TASK-003 IN_PROGRESS, no commit in 4 days').
- [x] THINK output example in THINK.md updated with evidence line.

### Definition of Done
- [x] PR approved

---

## TASK-027: CLI Migration — Node.js + TypeScript + Clean Architecture
**Meta:** P0 | L | REVIEW | Sprint 1 | 2-code-generation | claude-code | scripts/, package.json, docs/TASK-FORMAT.md
**Locked-by:** Gemini CLI | **Locked-at:** 2026-04-24T10:29:23.516908
**Depends:** TASK-024

### Acceptance Criteria
- [x] Node.js (v20+) project initialized with TypeScript.
- [x] Clean Architecture layers established: Domain, Use Cases, Adapters.
- [x] Parity with current 'arch' commands: conduct, exec, status, task.
- [x] Native TASK-FORMAT v0.2 validation logic (regex-based).
- [x] Bundle process (esbuild/tsup) created for zero-dep redistribution.

### Definition of Done
- [x] 'arch' command in package.json points to the new Node/TS implementation.
- [x] PR approved.

---

## TASK-012: Design and implement REVIEWER agent protocol
**Meta:** P1 | M | READY | Sprint 1
**Class:** 6-writing
**CLI:** claude
**CLI-reason:** protocol design requires coherent prose and architectural judgment
**Context-budget:** agents/EXEC.md + this task + docs/agents/CONDUCTOR.md + docs/GUIDELINES.md
**Depends:** none

### Acceptance Criteria
- [ ] `docs/agents/REVIEWER.md` created with full protocol (trigger, context-budget, output format)
- [ ] Trigger defined: post-push hook, manual invocation, or CI step — decision recorded in protocol
- [ ] Output mode defined: PR comments with write access OR file-based report
- [ ] Context-budget field set with PR diff size limit
- [ ] Semver impact declared: PATCH or MINOR
- [ ] REVIEWER mode added to `CLAUDE.md` modes section
- [ ] "Obvious miss" defined concretely: unchecked AC, incomplete DoD, out-of-scope change

### Definition of Done
- [ ] PR approved
- [ ] REVIEWER agent invocable from CLAUDE.md like any other mode
