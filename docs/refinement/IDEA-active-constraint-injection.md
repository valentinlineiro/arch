# IDEA: active-constraint-injection
**Created:** 2026-05-18
**Source:** Operator session — Moat activation analysis; execution-time vs analysis-time distinction
**Status:** DRAFT
**Meta:** P1 | M | claude | cli/src/main/ts/application/commands/task-command.ts, .arch/context-index.json, docs/adr/, docs/tensions/

## Problem

ARCH accumulates repo-specific knowledge in several stores:
- `docs/adr/` — architectural decisions with rationale and constraints
- `docs/tensions/` — weak signals and repeating friction patterns
- `.arch/causal-signal.jsonl` — execution-derived causal patterns
- `.arch/context-index.json` — symbol-to-file index

This knowledge is available for query (`arch memory ask`, `arch memory causal`) but is not injected at execution time. An agent that never queries these stores operates on generic model priors. Most agents don't query them unless the task description contains an explicit prompt.

The gap: constraint capture is passive. Constraint application is optional. An agent can implement TASK-XXX, violate an ADR, and the violation surfaces only at `arch review` — after the implementation commit.

Active Constraint Injection changes this. Before a task moves to IN_PROGRESS, the system surfaces the constraints that are specifically relevant to that task's context files, then injects them into the agent's working context. The agent is not blocked — it is informed. The warning happens before implementation, not after.

## Proposed solution

**New step in `arch task start TASK-XXX`:** after the task is loaded and before IN_PROGRESS is committed, run a constraint scan:

1. Read the task's `Context:` field to get the list of affected files/paths.
2. Query the context index and ADR store for ADRs that reference any of those paths.
3. Query `docs/tensions/` for open TENSIONs whose `Affected tasks` or file scope overlaps the context paths.
4. Query `.arch/causal-signal.jsonl` for recent (last 30 days) `hansei_signal:*` events in the same paths, grouped by Hansei category.
5. Emit a structured `## Constraint Preflight` block to stdout:

```
  ── Constraint Preflight: TASK-XXX ──────────────────────────────
  ADR constraints:
    ADR-009: XS/S tasks self-archive only when DeterministicACVerifier passes
             → affects: cli/src/main/ts/application/use-cases/drift-checker.ts
    ADR-019: Hansei format is structured diagnostic block; narrative prose fails review
             → affects: docs/TASK-FORMAT.md

  Open tensions:
    TENSION-003: [SpecDrift] — 4 occurrences in cli/src/main/ts/domain/
                 → last seen: TASK-931 (2026-05-18)

  Recent friction (30d):
    [ContextWaste] × 2 in cli/src/main/ts/application/
    [SpecDrift] × 3 in docs/
  ────────────────────────────────────────────────────────────────
```

6. The preflight block is printed to stdout only — not written to any file, not appended to INBOX.

**Key design constraints:**
- Preflight is advisory, not blocking. `arch task start` always proceeds after printing.
- Preflight output goes to stdout. The implementing agent reads it; the governance system does not parse it.
- No new files created by the preflight scan. Read-only against existing stores.
- If a context path has no constraints, omit that section silently. No "nothing found" noise.
- Preflight scan must complete in < 500ms (index-driven lookup, not full corpus scan).

**Where this activates the Moat:** the value of ADRs, tensions, and causal patterns compresses only if they reach the agent at decision time. A constraint that sits in `docs/adr/ADR-009.md` and is never read before implementation is effectively dead weight. Injection converts passive documentation into active working memory.

## What this is not

- Not a pre-flight blocker. Constraint violations are still caught by `arch review` at commit time.
- Not a semantic reasoner. The match is structural (path overlap, ADR file references) — not semantic similarity.
- Not a replacement for `arch memory ask`. The preflight surfaces constraints; the human still queries for deeper reasoning.

## Dependencies
- `.arch/context-index.json` must be populated (via `arch memory index` / govern tick). Pre-existing.
- Causal signal log must exist at `.arch/causal-signal.jsonl`. Pre-existing.

## Estimated size
M

## Gaps
<!-- THINK fills this section — do not edit manually -->

## Decision
PROMOTE → TASK-938
[influenced-by: none]
