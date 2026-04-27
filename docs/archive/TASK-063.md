## TASK-063: Fix scaffold script drift to align with v0.4 modular layout
**Meta:** P0 | M | DONE | Focus:yes | 1-implementation | local | scripts/, docs/, cli/, arch.config.json

### Acceptance Criteria
- [ ] Update `scripts/arch-install.sh` to use the v0.4 directory structure.
- [ ] Update `scripts/arch-init.sh` to scaffold `docs/tasks/`, `docs/archive/`, etc.
- [ ] Update `scripts/arch-upgrade.sh` to reconcile legacy monolithic files into the new layout.
- [ ] Remove all references to legacy files (`SPRINT.md`, `BACKLOG.md`, etc.) from scripts.
- [ ] Verify that a fresh install creates a valid v0.4 repository.

### Definition of Done
- [ ] Scaffolding scripts produce a structure that passes `arch review`.
- [ ] Upgrade path successfully migrates or warns about legacy files.
