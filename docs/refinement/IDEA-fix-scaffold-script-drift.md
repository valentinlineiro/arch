# IDEA: Fix scaffold script drift
**Created:** 2026-04-27
**Source:** Protocol review finding
**Status:** DRAFT
**Meta:** P0 | M | local | scripts/, docs/, cli/, arch.config.json

## Problema
The current scaffolding and upgrade scripts still reference the legacy monolithic layout (`SPRINT.md`, `BACKLOG.md`, `GUIDELINES.md`, `CONDUCTOR.md`, `EXEC.md`, `REFINE.md`). A fresh install or upgrade can therefore scaffold broken files or fail to recognize a valid v0.4 repository.

## Solución propuesta
Update `scripts/arch-install.sh`, `scripts/arch-init.sh`, and `scripts/arch-upgrade.sh` to use the current modular layout (`docs/tasks/`, `docs/archive/`, `docs/guidelines/`, `docs/agents/THINK.md`, `docs/agents/DO.md`, `docs/refinement/`). Add verification so scaffolded output and upgrade preconditions match the actual repository structure.

## Dependencias
Review current v0.4 canonical layout and reconcile with `arch.config.json`. Coordinate with TASK-056 if path keys change during the same cycle.

## Tamaño estimado
M

## Gaps
<!-- THINK fills this section when invoked — do not edit manually -->

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
