## TASK-136: Implement Kaizen learning from review mistakes
**Meta:** P1 | S | READY | Focus:yes | 7-operations | local | docs/agents/THINK.md, docs/KAIZEN-LOG.md
**Depends:** none

### Acceptance Criteria
- [x] Implement parsing for the semi-structured output of `arch review` (via `--json` flag).
- [x] Update THINK Phase 3 to analyze review failures and propose specific hardening steps.
- [x] Log identified patterns and proposed protocol refinements in `docs/KAIZEN-LOG.md`.
- [x] Include a mechanism for humans to override or skip specific learnings (via `## Exceptions`).
- [x] `arch review` passes.

### Definition of Done
- [x] All ACs checked.
- [x] `arch review` passes.
