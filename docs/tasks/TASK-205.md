## TASK-205: Extend executable ACs - file:, grep:, prose: predicates + Auditor bypass
**Meta:** P1 | M | READY | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/, docs/TASK-FORMAT.md, docs/agents/DO.md
**Depends:** none

### Context
`cmd:` predicates and `arch validate --acs` are already implemented. This task adds `file:` and `grep:` sugar types, the `prose:` exemption marker, enforcement of the predicate requirement on all ACs, and Auditor bypass for fully machine-verified tasks.

### Acceptance Criteria
- [ ] `file: <path>` predicate passes when the file exists, fails otherwise → cmd: arch validate --acs TASK-205; exit: 0
- [ ] `grep: "<pattern>" <path>` predicate passes when the pattern is found, fails otherwise → prose: verified with a fixture task
- [ ] `prose: <reason>` marker exempts an AC from machine verification - `arch validate --acs` reports it as PROSE/SKIP → prose: verified with a fixture task
- [ ] `arch validate --acs` warns on any AC that has neither a predicate nor a `prose:` marker → prose: verified with a bare prose AC
- [ ] DO.md updated: tasks with zero `prose:` ACs skip the Auditor step → prose: verified by reading DO.md
- [ ] `docs/TASK-FORMAT.md` updated with `file:`, `grep:`, and `prose:` syntax → file: docs/TASK-FORMAT.md
- [ ] `arch review` passes → cmd: arch review; exit: 0
- [ ] Tests pass → cmd: npm test --prefix cli; exit: 0

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
- [ ] `npm test` passes in `cli/`.
