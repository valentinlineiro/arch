## TASK-059: Create arch-upgrade.html for version migration
**Meta:** P2 | S | IN_PROGRESS | Focus:yes | 2-code-generation | local | docs/
**Depends:** none

### Acceptance Criteria
- [ ] Create `docs/arch-upgrade.html` — single HTML file, no framework
- [ ] Implement local JSON paste and remote template fetch from GitHub main
- [ ] Implement simple JS visual diff engine to highlight changes in `arch.config.json`
- [ ] Generate migration suggestions based on detected fields
- [ ] Style consistently with ARCH design (dark mode)

### Definition of Done
- [ ] Tool functional in `docs/`
- [ ] Able to detect changes between v0.3 and v0.4
- [ ] PR approved
