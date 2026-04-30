## TASK-134: Integrate Git staging into the archival process
**Meta:** P2 | XS | READY | Focus:no | 7-operations | local | docs/agents/THINK.md, scripts/arch.sh
**Depends:** none

### Acceptance Criteria
- [ ] Update the archival logic (in `arch archive` or THINK Phase 1) to use git commands.
- [ ] Automatically stage the deletion from `docs/tasks/` and addition to `docs/archive/`.
- [ ] Use `git mv` or equivalent `git rm` and `git add` to ensure history is tracked.
- [ ] Verify functionality in different environments (local vs CI).
- [ ] `arch review` passes.

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
