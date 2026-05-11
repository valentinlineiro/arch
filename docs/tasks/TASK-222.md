## TASK-222: arch ask v1 - grep-based memory query
**Meta:** P1 | S | IN_PROGRESS | Focus:yes | 2-code-generation | claude-code | cli/src/main/ts/
**Depends:** none

### Context
`arch ask "<question>"` is the inflection point between protocol system and cognitive infrastructure. 218 tasks are archived but not queryable. This is v1: no embeddings, no vector DB, no semantic engine. Grep-based retrieval over the full corpus (archive, tasks, ADRs, guidelines, KAIZEN-LOG, RETRO, PRINCIPLES). Primitive synthesis via entity ref aggregation and ranked excerpts. Mediocre and real beats elegant and late.

Implementation constraint from docs/IDENTITY.md: start with the smallest useful answer.

### Acceptance Criteria
- [ ] `arch ask "<question>"` tokenizes the question, scores corpus files by keyword hit count, and prints top matches with excerpts → cmd: arch ask "why do tasks fail review"; exit: 0
- [ ] Output includes: keywords used, matched files with hit count, unique TASK/ADR/P- refs found in matching files → prose: verified by reading output
- [ ] No results for a question with only stop words produces a clear error message → prose: verified manually
- [ ] Unit tests for AskCorpus tokenization and scoring → cmd: npm test --prefix cli; exit: 0
- [ ] `arch review` passes → cmd: arch review; exit: 0

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
- [ ] `npm test` passes in `cli/`.

### Hansei
<!-- to be filled on close -->
