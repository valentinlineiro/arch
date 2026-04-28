## IDEA-arch-upgrade-diff-tool
**Type:** feature | **Source:** Kaizen 2026-04-27 | **Priority:** P2 | **Status:** DECIDED

### Observation
Scaffolded projects have no way to consume ARCH framework updates. When `arch.config.json` schema changes (e.g., v0.3 → v0.4), users must manually diff and migrate.

### Proposal
Create `arch-upgrade.html` — browser-based tool:
1. User pastes their local `arch.config.json`
2. Fetches latest template from GitHub raw URL
3. Shows diff: added/removed/changed fields
4. Generates migration script or explains changes

### Decision
Implement arch-upgrade.html as a browser tool. Ensure it handles nested JSON diffs and provides clear migration instructions.
PROMOTE -> TASK-059