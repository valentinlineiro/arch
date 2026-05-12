## TASK-222: arch ask v1+v2 - grep-based memory query with causal synthesis
**Meta:** P1 | M | DONE | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/
**Closed-at:** 2026-05-12T07:53:50.043Z
**Depends:** none

### Context
`arch ask "<question>"` is the inflection point between protocol system and cognitive infrastructure. v1 shipped (grep-based, ranked excerpts, entity refs). Not yet operational: entity ref list is noisy (all refs from all matching files), no repeated-failure detection, no causal synthesis. v2 closes those gaps.

v1 already committed. This task completes the operational bar.

### Acceptance Criteria
- [x] `arch ask "<question>"` tokenizes, scores, outputs ranked excerpts + entity refs → cmd: arch ask "why do tasks fail review"; exit: 0
- [x] Entity refs scoped to top-5 matches only, not all matches → prose: verified by running a broad query and checking ref count
- [x] Repeated-failure detection: if the same task ID appears in 3+ top matches, flag it as a recurring signal → prose: verified by reading output
- [x] `arch review` passes → cmd: arch review; exit: 0
- [x] `npm test --prefix cli` passes → cmd: npm test --prefix cli; exit: 0

### Definition of Done
- [x] All ACs checked.
- [x] `arch review` passes.
- [x] `npm test` passes in `cli/`.

## Hansei
Task was implemented and committed 2026-05-11 but never formally closed. The recurring signal detection threshold ended up at 2+ tasks (failure patterns) and 3+ matches (recurring signals) — two separate signals rather than the single threshold the AC described. Both are useful in practice.
