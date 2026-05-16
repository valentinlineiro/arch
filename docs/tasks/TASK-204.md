## TASK-204: Escalation maturity Phase 3 - E5 Verifiable
**Meta:** P2 | M | REVIEW | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/, docs/
**Depends:** TASK-203, TASK-194

### Context
Phase 3 of 3. Escalations become verifiable: `arch review` checks that every halt was resolved, and integration tests prove escalation paths work.

### Acceptance Criteria
- [x] `arch review` checks that each entry in `docs/HALT-LOG.md` has a corresponding human resolution or explicit deferral - unresolved halts cause a review violation → cmd: arch review; exit: 0
- [x] Integration tests cover at least three missed-escalation scenarios: (a) protected-path edit without ADR, (b) ambiguous task shape reaching `arch task start`, (c) stale INBOX not blocking `arch next` → cmd: npm test --prefix cli; exit: 0
- [x] `arch review` passes → cmd: arch review; exit: 0
- [x] Tests pass → cmd: npm test --prefix cli; exit: 0

### Definition of Done
- [x] All ACs checked.
- [x] `arch review` passes.
- [x] `npm test` passes in `cli/`.

## Hansei
**Severity:** H0
**Category:** [no-issue]
**Decision:** Implemented AC1 (HALT-LOG unresolved entry detection in checkHaltPolicy) and AC2 (4 integration tests: protected path, ambiguous task, stale INBOX, unresolved halt). All 4 escalation scenarios covered. 391 tests pass.
**Constraint:** DriftChecker test mocking requires careful rootPath/file key alignment — mock file keys must be prefixed with './' when rootPath is '.'.
**Cost:** None — no architectural debt introduced.
**Forward Action:** None required.
