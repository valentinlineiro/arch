## TASK-200: Implement arch task compress - lossy archive compression for Kaizen signal
**Meta:** P1 | M | READY | Focus:yes | 2-code-generation | claude-code | docs/archive/, cli/src/main/ts/
**Depends:** none

### Acceptance Criteria
- [ ] `arch task compress` command rewrites a task file in `docs/archive/` to the canonical minimal form: ID, title, Meta line, Closed-at, Hansei, blockers encountered → cmd: test -f docs/archive/TASK-200.md; exit: 0
- [ ] Compression is lossy - Context, AC prose, lock lines, and implementation notes are dropped → prose: verified by inspecting a compressed file
- [ ] Compressed format is a subset of TASK-FORMAT (no new schema - existing tooling reads it) → prose: verified by running arch validate on a compressed task
- [ ] `arch task compress --all` compresses all files in `docs/archive/` in batch → prose: verified manually
- [ ] Census PURGE trigger: when Census emits PURGE for `docs/archive/`, the output includes the command `arch task compress --all` → prose: verified by reading Census output
- [ ] `arch review` passes → cmd: arch review; exit: 0
- [ ] Tests pass → cmd: npm test --prefix cli; exit: 0

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
- [ ] `npm test` passes in `cli/`.
