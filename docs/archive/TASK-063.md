## TASK-063: Fix scaffold script drift to align with v0.4 modular layout
**Meta:** P0 | M | DONE | Focus:yes | 1-implementation | local | scripts/, docs/, cli/, arch.config.json
**Closed-at:** 2026-04-27T13:59:26Z
**Iterations:** 2

### Acceptance Criteria
- [x] Update `scripts/arch-install.sh` to use the v0.4 directory structure.
- [x] Update `scripts/arch-init.sh` to scaffold `docs/tasks/`, `docs/archive/`, etc.
- [x] Update `scripts/arch-upgrade.sh` to reconcile legacy monolithic files into the new layout.
- [x] Remove all references to legacy files (`SPRINT.md`, `BACKLOG.md`, etc.) from scripts.
- [x] Verify that a fresh install creates a valid v0.4 repository.

### Definition of Done
- [x] Scaffolding scripts produce a structure that passes `arch review`.
- [x] Upgrade path successfully migrates or warns about legacy files.
