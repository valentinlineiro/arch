## TASK-059: Create arch-upgrade.html for version migration
**Meta:** P2 | S | DONE | Focus:yes | 2-code-generation | local | docs/
**Depends:** none
**Closed-at: 2026-04-27T18:30:00Z**

### Acceptance Criteria
- [x] Create `docs/arch-upgrade.html` — single HTML file, no framework
- [x] Implement local JSON paste and remote template fetch from GitHub main
- [x] Implement simple JS visual diff engine to highlight changes in `arch.config.json`
- [x] Generate migration suggestions based on detected fields
- [x] Style consistently with ARCH design (dark mode)

### Definition of Done
- [x] Tool functional in `docs/`
- [x] Able to detect changes between v0.3 and v0.4
- [x] PR approved
