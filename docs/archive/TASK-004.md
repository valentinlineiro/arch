## TASK-004: Build npx arch-init (remote installer)
**Meta:** P1 | M | DONE | Sprint 1 | 2-code-generation | codex | scripts/arch-install.sh
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