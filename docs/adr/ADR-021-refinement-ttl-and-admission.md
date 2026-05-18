# ADR-021: Refinement funnel TTL and admission gate

**Status:** ACCEPTED  
**Date:** 2026-05-18  
**Deciders:** Operator

## Context

The refinement queue accumulated 25+ IDEA files because entry was cheap (any speculative idea
got its own file) and exit was expensive (THINK evaluation + human promotion + archiving). This
created a second backlog that imposed cognitive load on every THINK session without proportional
value.

## Decision

1. **Admission gate:** Individual `IDEA-*.md` files are reserved for *executable candidates* —
   ideas with a clear deliverable, known scope, and describable acceptance shape. Speculative or
   exploratory ideas are held in a single `docs/refinement/ROADMAP-IDEAS.md` file.

2. **TTL enforcement:** A `refinement.ttlCycles` field in `arch.config.json` (default: 10)
   defines the staleness threshold. An IDEA with no Decision field after N THINK sessions is
   tagged `STALE` and surfaced to INBOX for human adjudication. THINK surfaces; it does not
   decide.

3. **`arch.config.json` change:** Add `"refinement": { "ttlCycles": 10 }` block. This field is
   read by THINK Phase 1 step 3b.

## Consequences

- Refinement queue size is bounded by the admission gate; speculative ideas accumulate in a
  single file, not a growing list of stubs.
- THINK sessions have a clear disposal path for stale IDEAs (surface to INBOX) without making
  an autonomy-violating decision.
- Operators who want to bypass TTL must write a Decision field (`DEFERRED: <reason>`) explicitly.

## Does NOT evaluate

- Whether any specific IDEA content is valid.
- Priority ordering within ROADMAP-IDEAS.md.
