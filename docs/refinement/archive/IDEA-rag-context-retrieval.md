# IDEA: RAG context retrieval — semantic search over ARCH corpus
**Created:** 2026-05-05
**Source:** User-identified friction — agents duplicate past work and context windows overflow
**Status:** DEFERRED
**Meta:** P2 | M | claude | docs/tasks/, docs/archive/, docs/guidelines/, docs/adr/, docs/refinement/

## Problem
Agents accumulate context by loading large doc sets, causing token waste and missed relevant history. Two compounding issues: (1) agents repeat work already done or rejected, because they lack recall of past tasks; (2) context windows fill up fast when loading docs wholesale.

## Proposed solution
Add RAG to ARCH using `@huggingface/transformers` (WASM) for embeddings and `sqlite-vec` for vector storage. No external service, no API key — works locally and in GitHub Actions identically.

Key design decisions (captured in full spec at `docs/superpowers/specs/2026-05-05-rag-arch-design.md`):
- New CLI commands: `arch index` (build/update index) and `arch rag <query>` (retrieve top-K chunks)
- Index stored in `docs/.rag/index.db`, committed to repo for warm CI starts
- Post-commit git hook keeps index fresh incrementally (`arch index --changed`)
- Protocol integration: DO.md gets a pre-task RAG lookup; THINK.md gets a pre-evaluation RAG lookup for IDEAs; `arch next` and `arch task review` are enriched automatically
- RAG is advisory only — never gates or blocks any command

## Dependencies
None.

## Estimated size
M

## Gaps
<!-- THINK fills this section when invoked — do not edit manually -->

## Decision
DEFERRED: Valid long-term direction. Gated on Phase C/D prerequisites or insufficient corpus.

## Decision
DEFERRED: Phase C gated on corpus. Not actionable until arch ask is compounding.
