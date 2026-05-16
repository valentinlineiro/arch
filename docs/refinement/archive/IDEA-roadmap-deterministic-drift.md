# IDEA: Roadmap — Deterministic Drift & Contextual Checks
**Created:** 2026-05-15
**Source:** DaaS Sprint Reflection
**Status:** DEFERRED
**Meta:** P2 | M | local | cli/src/main/ts/

## Problem
The THINK protocol currently relies on LLM analysis in Phase 2.5 to detect "Semantic Drift" and "Conceptual Contradictions." This is expensive and non-deterministic.

## Proposed solution
Expand `DriftChecker.ts` to include structural proxies for semantic drift.

**Proposed Checks:**
1.  **Context-ADR Mismatch:** Warn if a task touches a `protectedPath` but does not reference the ADR that governs that path (deterministic via `ContextIndex`).
2.  **Class-Context Deviation:** Identify tasks in the same `class` that touch significantly different file sets, signaling a possible misclassification or domain leak.
3.  **Hansei Pattern Matching:** Deterministically flag repeating `Category` values across the last 10 archived tasks (e.g., 3 `[ContextWaste]` signals in one sprint).

## Rationale
Moves "Thinking" tasks into the "Governance" layer. By detecting structural anomalies through data, we reduce the need for generative AI to "notice" that something is wrong.

## Dependencies
`DriftChecker.ts`, `ContextIndex.json`.

## Estimated size
M

## Decision
<!-- PROMOTE → TASK-XXX | REJECT: reason -->

### Decision
DEFERRED: Scope absorbed by TENSION-002 (ExcisionStructuralCheck) and active DriftChecker work.
