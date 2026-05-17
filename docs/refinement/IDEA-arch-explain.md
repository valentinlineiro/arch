# IDEA: arch explain — reconstruct causal chain for a closed task
**Created:** 2026-05-17
**Source:** Session observation — no command exists to surface task provenance
**Status:** DRAFT
**Sessions:** 0
**Meta:** P2 | M | 1-code-reasoning | cli/src/main/ts/application/commands/, cli/src/main/ts/application/use-cases/causal-signal-log.ts

## Problem

Given a closed task, ARCH has all the data to reconstruct *why* it was done: the IDEA that spawned it, the refinement sessions it went through, the Hansei signals it generated, and any forward actions it triggered. But no command surfaces this chain. Before starting a related task, an agent or human must manually grep the archive, refinement/archive, and causal signal log to reconstruct context. This is exactly the kind of retrieval that should be automated.

## Proposed Solution

`arch explain TASK-XXX` — given a task ID, output:

1. **Origin:** IDEA slug (if promoted from refinement) or direct creation reason
2. **Decision record:** the Decision field from the promoting IDEA
3. **Hansei:** severity, category, decision, and forward action from the closed task
4. **Causal signals emitted:** any H2/H3 signals written to `.arch/causal-signal.jsonl` with `candidate_from: TASK-XXX`
5. **Downstream:** tasks or IDEAs referenced in the Forward Action field
6. **Related:** other tasks with the same Hansei category (pattern context)

Output is terminal-only. No file writes. Non-blocking.

## Constraint Axes
- Dependency ordering: Depends on causal-signal.jsonl having entries — useful after corpus builds
- Temporal validity: Valid now; grows more valuable with corpus
- Abstraction layer: Correct — read-only retrieval, no governance path
- Observability validity: Fully deterministic — reads structured data only
- Priority displacement: P2 — useful but not blocking

## Decision
<!-- PROMOTE → TASK-XXX | REJECT: reason | DEFERRED: reason + condition -->
