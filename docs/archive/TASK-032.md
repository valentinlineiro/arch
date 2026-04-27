## TASK-032: Add drift detection to arch review
**Meta:** P1 | S | DONE | Sprint 3 | 2-code-generation | claude-code | src/
**Depends:** none

### Acceptance Criteria
- [x] `arch review` checks commands documented in README against actual CLI subcommands — reports missing or extra
- [x] `arch review` compares version in `arch.config.json` vs. `arch --version` output — fails if mismatch
- [x] `arch review` verifies every file path referenced in AGENTS.md exists on disk — lists missing files
- [x] Drift checks run as part of existing `arch review` flow, not as a new command

### Definition of Done
- [x] All three checks implemented and passing on clean repo
- [x] `arch review` output includes a "Drift" section with OK / WARN per check
- [x] PR approved
