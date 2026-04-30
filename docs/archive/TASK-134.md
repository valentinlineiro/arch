## TASK-134: Integrate Git staging into the archival process
**Meta:** P2 | XS | DONE | Focus:no | 7-operations | local | docs/agents/THINK.md, scripts/arch.sh
**Closed-at:** 2026-04-30T09:46:40.192Z
**Depends:** none

### Acceptance Criteria
- [x] Update the archival logic (in `arch archive` or THINK Phase 1) to use git commands.
- [x] Automatically stage the deletion from `docs/tasks/` and addition to `docs/archive/`.
- [x] Use `git mv` or equivalent `git rm` and `git add` to ensure history is tracked.
- [x] Verify functionality in different environments (local vs CI).
- [x] `arch review` passes.

### Definition of Done
- [x] All ACs checked.
- [x] `arch review` passes.
