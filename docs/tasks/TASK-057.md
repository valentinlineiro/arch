## TASK-057: Sync AGENTS.md version with arch.config.json
**Meta:** P1 | S | IN_PROGRESS | Focus:yes | 6-writing | claude | docs/

### Bug
- `arch.config.json` says version `v0.4.0`
- `docs/AGENTS.md` header says `v0.3`
- Drift causes confusion about which version is current

### Root Cause
Manual version updates not synchronized.

### Fix
1. Update AGENTS.md header to v0.4
2. Add auto-sync mechanism to prevent future drift

### Acceptance Criteria
- [ ] Update docs/AGENTS.md version to v0.4.0
- [ ] Auto-sync CLI package.json version with arch.config.json (or add note to review)