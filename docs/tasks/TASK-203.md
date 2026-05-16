## TASK-203: Escalation maturity Phase 2 - E4 Fail-Closed
**Meta:** P2 | M | READY | Focus:yes | 2-code-generation | claude-code | cli/src/main/ts/, docs/agents/DO.md
**Depends:** TASK-202

### Context
Phase 2 of 3. Ambiguous task shape and stale INBOX now cause hard failures rather than silent improvisation.

### Acceptance Criteria
- [ ] `arch task start TASK-XXX` exits non-zero when the task fails the Definition of Ready: missing any Meta field (Priority, Size, Status, Focus, Class, CLI, Context), no ACs, or M+ task missing Gaps section → cmd: arch task start TASK-XXX; exit: 1
- [ ] `arch task start` on a valid READY task succeeds → prose: verified with a well-formed task
- [ ] Stale INBOX (last regeneration timestamp > 24h ago) causes `arch next` to emit a HALT reason and exit non-zero → prose: verified by backdating INBOX and running arch next
- [ ] `arch review` passes → cmd: arch review; exit: 0
- [ ] Tests pass → cmd: npm test --prefix cli; exit: 0

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
- [ ] `npm test` passes in `cli/`.
