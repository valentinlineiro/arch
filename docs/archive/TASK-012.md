## TASK-012: Implement deterministic REVIEWER engine in CLI
**Meta:** P1 | M | 5 | DONE | Sprint 1 | 2-code-generation | claude-code | docs/GUIDELINES.md, src/domain/
**Depends:** TASK-027

### Acceptance Criteria
- [x] Reviewer logic implemented as Application Use Cases or pure Domain Services.
- [x] Explicit separation between Review logic (Domain) and Git/Filesystem interaction (Infrastructure).
- [x] Rules implemented: Canonical format (regex v0.2), Commit prefix (GUIDELINES), AC completion before DONE.
- [x] Command 'arch review' (or extension of 'validate') capable of checking 'git diff'.
- [x] CI-ready output: clear list of violations and non-zero exit code on failure.
- [x] Unit tests for each validation rule in isolation.

### Definition of Done
- [x] PR approved
- [x] 'arch review' functional and tested in the CLI binary.