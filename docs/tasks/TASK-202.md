## TASK-202: Escalation maturity Phase 1 - Level 3 Detectable
**Meta:** P1 | M | REVIEW | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/application/use-cases/drift-checker.ts, cli/src/main/ts/
**Lock:** claude-code
**Depends:** TASK-193

### Context
Phase 1 of 3 toward escalation Level 5. Adds git integration to `arch review` so violations are detected automatically rather than relying on agent judgment.

### Acceptance Criteria
- [x] `arch review` gains git diff parsing: flags commits that touch paths listed in `arch.config.json:protectedPaths` without a corresponding ADR entry in `docs/adr/` → cmd: arch review; exit: 0
- [x] `arch review` flags tasks that have gone through a REVIEW → READY → REVIEW cycle (repeated review failure detection) → prose: verified by checking a task with repeated review history
- [x] `arch next` emits HALT when a task's estimated cost exceeds the configured budget threshold → prose: verified by setting a low threshold and running arch next
- [x] `arch review` passes → cmd: arch review; exit: 0
- [x] Tests pass → cmd: npm test --prefix cli; exit: 0

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
- [ ] `npm test` passes in `cli/`.
