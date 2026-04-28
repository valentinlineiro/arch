## TASK-077: Automate push after successful arch review
**Meta:** P3 | S | READY | Focus:yes | 7-operations | local | scripts/arch.sh
**Depends:** none
### Acceptance Criteria
- [x] Add a `--push` flag to `arch review` in `scripts/arch.sh`.
- [x] If `--push` is present and review is OK, execute `git push`.
- [x] Ensure `git push` is NOT executed if any review check fails.

### Definition of Done
- [x] `arch review --push` works as expected.
- [x] Manual verification of safety (no push on failure).
- [ ] `arch review` passes.
