# IDEA: memory-ask-narrow-scope
**Created:** 2026-05-18
**Source:** Operator session — LLM surface reduction; arch memory ask should be a deterministic corpus tool, not a general-purpose Q&A interface
**Status:** DRAFT
**Meta:** P2 | S | claude | cli/src/main/ts/application/use-cases/ask-corpus.ts, cli/src/main/ts/application/commands/ask-command.ts

## Problem

`arch memory ask` is a deterministic corpus tool (token overlap, no LLM currently). However, its output surface and query scope are broad:

- `CORPUS_DIRS` includes `docs/tasks`, `docs/archive`, `docs/adr`, `docs/guidelines` — full repo corpus
- `CORPUS_FILES` includes `docs/IDENTITY.md` and other top-level docs
- The `answer` field in `AskResult` is populated by extracting text from `IDENTITY.md` for DEFINITIONAL queries — a special-case that leaks a doc-retrieval pattern into a query tool
- The `causeGroups` and `recurringSignals` fields in output duplicate what `arch govern reflect` (THINK) is responsible for surfacing

The risk: `arch memory ask` becomes a de facto open-ended Q&A surface that future contributors add LLM to ("to improve answer quality") without recognizing that the deterministic token-overlap approach is the correct design for this layer.

## Proposed Solution

**Narrow `arch memory ask` to structured lookups only. Make the boundary with THINK explicit.**

1. **Remove `answer` field from AskResult output** (or demote to internal only). The answer extraction from IDENTITY.md is a one-off retrieval hack. If an operator wants IDENTITY.md content, `arch memory explain TASK-XXX` or direct file reading is the right path.

2. **Remove `causeGroups` and `recurringSignals` from the default output** of `arch memory ask`. These are THINK-layer signals. Surfacing them in the ask output blurs the boundary. Move them to a dedicated `arch memory patterns` subcommand (stdout-only, clearly labeled as THINK-layer input, not a result).

3. **Scope `CORPUS_DIRS` to moat artifacts only**: `docs/archive`, `docs/adr`. Active tasks (`docs/tasks`) and guidelines are operational — they belong in the task-start preflight (TASK-938), not in corpus queries. Guidelines are stable enough to be indexed separately.

4. **Document the boundary explicitly**: Add a comment in `ask-corpus.ts` (and `arch memory ask` help text) stating that this command is deterministic by design and must not call LLM providers.

## What this is not

- Not removing `arch memory ask` — it's a valid moat tool for locating past decisions and task refs
- Not adding LLM to compensate — the deterministic output is the feature, not a limitation
- Not affecting THINK mode — `arch govern reflect` remains the semantic analysis layer

## Dependencies

- TASK-938 (active constraint injection) — that task already handles docs/adr and docs/tasks in the preflight context. Removing those from ask-corpus scope avoids duplication after TASK-938 ships.

## Estimated size
S

## Gaps
<!-- THINK fills this section — do not edit manually -->

## Decision
PROMOTE → TASK-942
[influenced-by: none]
