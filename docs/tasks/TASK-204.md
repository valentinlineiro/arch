## TASK-204: Escalation maturity Phase 3 - E5 Verifiable
**Meta:** P2 | M | READY | Focus:yes | 2-code-generation | claude-code | cli/src/main/ts/, docs/
**Depends:** TASK-203, TASK-194

### Context
Phase 3 of 3. Escalations become verifiable: `arch review` checks that every halt was resolved, and integration tests prove escalation paths work.

### Acceptance Criteria
- [ ] `arch review` checks that each entry in `docs/HALT-LOG.md` has a corresponding human resolution or explicit deferral - unresolved halts cause a review violation → cmd: arch review; exit: 0
- [ ] Integration tests cover at least three missed-escalation scenarios: (a) protected-path edit without ADR, (b) ambiguous task shape reaching `arch task start`, (c) stale INBOX not blocking `arch next` → cmd: npm test --prefix cli; exit: 0
- [ ] `arch review` passes → cmd: arch review; exit: 0
- [ ] Tests pass → cmd: npm test --prefix cli; exit: 0

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
- [ ] `npm test` passes in `cli/`.
