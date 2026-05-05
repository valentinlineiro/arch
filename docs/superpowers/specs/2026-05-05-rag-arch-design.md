# RAG for ARCH — Design Spec
**Date:** 2026-05-05
**Status:** APPROVED

## Problem

Two compounding pain points:
1. Agents miss relevant past tasks and decisions, leading to duplicate work and repeated mistakes.
2. Context windows fill up fast — loading all docs into every session is wasteful and expensive.

RAG addresses both: retrieve only what's relevant, at the moment it's needed.

## Architecture

**Components:**

- `arch index` — reads all docs, chunks by `##` heading, embeds via `@huggingface/transformers` (WASM), writes to `docs/.rag/index.db` (SQLite-vec).
- `arch rag <query>` — embeds the query, returns top-K chunks with source paths and metadata.
- **Post-commit git hook** — runs `arch index --changed` after every commit, re-embedding only files touched in that commit. Exits 0 regardless of outcome (never blocks a commit).
- **Enriched existing commands** — `arch next` and `arch task review` call `arch rag` internally and append a "Related context" section.

**Data flow:**

```
docs/**/*.md → chunker → @huggingface/transformers → embeddings → sqlite-vec
                                                                      ↑
                               arch rag <query> ─── embed query ──────┘
                                     ↓
                               top-K chunks + paths → protocol step / command output
```

**Index location:** `docs/.rag/index.db` — committed to the repo so CI has a warm index without re-indexing from scratch.

**Embedding model:** `Xenova/all-MiniLM-L6-v2` — 22MB, 384-dim, WASM, no API key. Cached at `~/.cache/huggingface/` on first use. Pinned version for reproducibility.

## Indexing

**Corpus:**

| Path | Content type |
|---|---|
| `docs/tasks/` | Active tasks |
| `docs/archive/` | Completed/rejected tasks |
| `docs/refinement/` | IDEA drafts |
| `docs/guidelines/` | Rules and conventions |
| `docs/adr/` | Architecture decisions |
| `docs/PRINCIPLES.md`, `docs/KAIZEN-LOG.md`, `docs/METRICS.md`, `docs/RETRO.md` | Institutional memory |

**Chunking:** Split at `##` headings. Each chunk carries: `source_path`, `heading`, `task_id` (if applicable), `status` (DONE/DRAFT/etc).

**Incremental reindex:** `arch index --changed` reads `git diff --name-only HEAD~1 HEAD`, re-embeds only those chunks, upserts by `source_path + heading` key.

**Full reindex:** `arch index --full` — for first setup or recovery.

## Protocol Integration

**DO.md — two new steps:**

1. After conflict resolution, before finding next task: run `arch rag "<task title>"` — output appended as "Related context" block before implementation starts.
2. `arch next` enriched internally — top-3 related past tasks included in output, giving the sentinel pre-flight richer context.

**THINK.md — one new step:**

- Phase 1 (Governance): before evaluating each IDEA draft, run `arch rag "<idea title>"` to surface similar archived tasks, prior rejections, and related principles.

**Enriched commands (no protocol changes):**

- `arch next` — appends top-3 related past tasks.
- `arch task review TASK-XXX` — appends related guidelines and ADRs.

RAG is **advisory only** — it surfaces information, never gates or blocks any command.

## Error Handling

- Index missing: `arch rag` prints a one-line warning and exits cleanly. No existing command breaks.
- WASM model load failure: same — warn to stderr, continue. RAG is never a hard dependency.
- Post-commit hook failure: hook always exits 0. Indexing errors go to stderr only.

## Testing

- **Unit:** chunker correctness (heading splits, metadata extraction), upsert/query logic.
- **Integration:** `arch index --full` on a fixture corpus, then `arch rag` returns expected results. CI uses pre-computed embeddings checked in as test fixtures — no model download in CI.
- No mocking of the embedding model in integration tests. Real WASM output, pinned model version.

## Metadata

- **Size:** M
- **Class:** 2-code-generation
- **Model tier:** claude-3-5-sonnet (M)
- **Priority:** P2
- **Dependencies:** none
