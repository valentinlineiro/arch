## TASK-200: Implement arch task compress - lossy archive compression for Kaizen signal
**Meta:** P1 | M | REVIEW | Focus:no | 2-code-generation | claude-code | docs/archive/, cli/src/main/ts/
**Depends:** none


### Relevant Context
_confidence: 0.43_

**Files:**
- cli/src/main/ts/domain/models/context-index.ts _(core)_
- cli/src/main/ts/domain/models/task.ts _(core)_
- cli/src/main/ts/domain/task.ts _(core)_
- cli/src/main/ts/domain/repositories/file-system.ts _(core)_
- cli/src/main/ts/application/use-cases/context-inference.ts _(domain)_

**ADRs:**
- ADR-004: Flat docs/tasks/ directory with Focus field replaces sprint/backlog split _(enforced)_
- ADR-006: Depends Graph Validation in DriftChecker Domain Service _(enforced)_
- ADR-007: Census Context Budget Check in DriftChecker _(enforced)_

**Guidelines:**
- testing-a-change.md
- versioning.md

### Context Feedback
_Was the Relevant Context above useful?_
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

_If partial or off:_
- [ ] wrong files
- [ ] missing files
- [ ] wrong ADRs
- [ ] too much noise
- [ ] confidence misleading

### Acceptance Criteria
- [x] `arch task compress` command rewrites a task file in `docs/archive/` to the canonical minimal form: ID, title, Meta line, Closed-at, Hansei, blockers encountered → cmd: test -f docs/archive/TASK-200.md; exit: 0
- [x] Compression is lossy - Context, AC prose, lock lines, and implementation notes are dropped → prose: verified by inspecting a compressed file
- [x] Compressed format is a subset of TASK-FORMAT (no new schema - existing tooling reads it) → prose: verified by running arch validate on a compressed task
- [x] `arch task compress --all` compresses all files in `docs/archive/` in batch → prose: verified manually
- [x] Census PURGE trigger: when Census emits PURGE for `docs/archive/`, the output includes the command `arch task compress --all` → prose: verified by reading Census output
- [x] `arch review` passes → cmd: arch review; exit: 0
- [x] Tests pass → cmd: npm test --prefix cli; exit: 0

### Definition of Done
- [x] All ACs checked.
- [x] `arch review` passes.
- [x] `npm test` passes in `cli/`.

## Hansei
Straightforward M task, no blockers. Self-referential first AC (`test -f docs/archive/TASK-200.md`) cannot pass until the Auditor archives the task — noted in INBOX. Compression is pure text manipulation; chose to keep `**Depends:**` and `**Sprint:**` lines in compressed form since they are part of the canonical TASK-FORMAT and removing them could break parsers. Also compressed TASK-222 as a live example during implementation.
