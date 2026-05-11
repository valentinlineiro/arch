## TASK-222: arch ask v1+v2 - grep-based memory query with causal synthesis
**Meta:** P1 | M | IN_PROGRESS | Focus:yes | 2-code-generation | claude-code | cli/src/main/ts/
**Depends:** none

### Context
`arch ask "<question>"` is the inflection point between protocol system and cognitive infrastructure. v1 shipped (grep-based, ranked excerpts, entity refs). Not yet operational: entity ref list is noisy (all refs from all matching files), no repeated-failure detection, no causal synthesis. v2 closes those gaps.

v1 already committed. This task completes the operational bar.

### Acceptance Criteria
- [x] `arch ask "<question>"` tokenizes, scores, outputs ranked excerpts + entity refs → cmd: arch ask "why do tasks fail review"; exit: 0
- [ ] Entity refs scoped to top-5 matches only, not all matches → prose: verified by running a broad query and checking ref count
- [ ] Repeated-failure detection: if the same task ID appears in 3+ top matches, flag it as a recurring signal → prose: verified by reading output
- [ ] `arch review` passes → cmd: arch review; exit: 0
- [ ] `npm test --prefix cli` passes → cmd: npm test --prefix cli; exit: 0

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
- [ ] `npm test` passes in `cli/`.

### Hansei
<!-- to be filled on close -->
