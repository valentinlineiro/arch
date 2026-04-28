## TASK-077: Automate push after successful arch review
**Meta:** P3 | S | READY | Focus:yes | 7-operations | local | scripts/arch.sh
**Depends:** none

### Acceptance Criteria
- [ ] Add a `--push` flag to `arch review` in `scripts/arch.sh`.
- [ ] If `--push` is present and review is OK, execute `git push`.
- [ ] Ensure `git push` is NOT executed if any review check fails.

### Definition of Done
- [ ] `arch review --push` works as expected.
- [ ] Manual verification of safety (no push on failure).
