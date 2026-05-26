## TASK-274: Implement arch rag command with semantic search over ARCH corpus
**Meta:** P3 | M | REJECTED | Focus:no | 2-code-generation | claude | cli/src/main/ts/, docs/tasks/, docs/archive/, docs/adr/

### Context

Agents currently accumulate context by loading large document sets, causing token waste and repeated work. This task adds RAG infrastructure using `@huggingface/transformers` (WASM) and `sqlite-vec` for local, API-key-free semantic search. New commands `arch index` and `arch rag <query>` enable retrieval of relevant history from the ARCH corpus.

### Acceptance Criteria

- [ ] `arch index` builds/updates a vector index at `docs/.rag/index.db` from the ARCH corpus (tasks, archive, ADRs, guidelines).
- [ ] `arch rag <query>` returns the top-K relevant chunks from the index without requiring any external API key.
- [ ] `arch review` passes.  →  cmd: arch review; exit: 0

### Definition of Done

- [ ] `arch index` and `arch rag` commands implemented with local embeddings and sqlite-vec storage.
- [ ] `arch review` passes.

## Hansei
**Severity:** H0
**Category:** [SpecDrift]

**Decision:**
Task created at promotion time; no implementation decisions made yet.

**Constraint:**
Hansei fields populated at creation to satisfy pre-commit linter requirement for M+ tasks.

**Cost:**
No implementation cost incurred at this stage.

**Forward Action:**
Real Hansei to be written at REVIEW time per ADR-019.
