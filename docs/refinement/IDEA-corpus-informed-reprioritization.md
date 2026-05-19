# IDEA: corpus-informed-reprioritization
**Meta:** Source: human | Status: DRAFT | Sessions: 1
**Created:** 2026-05-19

## Problem

Task priority today is set at creation time and rarely updated. The corpus (archive, ADRs, kaizen log, causal graph) accumulates evidence that should influence priority — but this evidence is never fed back into the READY queue.

Concrete gaps:
- A READY task that shares a root cause with 3 archived failures is not marked higher than one with no failure history.
- A task that unblocks 5 dependents is P2; a standalone cosmetic task is also P2. No structural signal distinguishes them.
- `arch govern` assigns Focus based on priority alone; it has no view of corpus signals when doing so.
- THINK can observe patterns but cannot write to task priority — it can only propose. The proposal lands in INBOX and typically isn't acted on.

The result: priority is the human's estimate at creation time, unrevised, degrading in accuracy as the corpus grows.

## Proposed direction

**`arch task reprioritize`** — a deterministic command that reads the corpus and emits a priority diff for human review. It does not write to task files without explicit human confirmation.

### Signal sources (deterministic, no LLM)

1. **Recurrence count** — how many archived tasks share keywords/labels with this READY task (from `.arch/temporal-index.jsonl` once TASK-954 lands, or from archive keyword scan).
2. **Unblock fan-out** — how many READY/BLOCKED tasks have this task in their `Depends:` chain.
3. **Causal ancestry** — is this task a forward action from a Hansei H0/H1? If so, bump.
4. **Age since creation** — tasks that have been READY for >60 days without priority change are candidates for demotion (stale estimate) or escalation (forgotten urgency).
5. **Class mismatch** — P3 task in a class that has historically caused H0/H1 failures gets a flag.

### Output format

```
arch task reprioritize

  TASK-242  P3 → P2   unblocks 0 | recurrence 0 | causal: none | age: 47d
  TASK-954  P2 → P1   unblocks 3 | recurrence 4 | causal: H1 forward action
  TASK-206  P3 → park  unblocks 7 but no agent assigned | age: 91d → BLOCKED candidate

Apply? (y/N)
```

Human confirms; command writes updated Meta lines and commits with `chore: [TASK-XXX] reprioritize — corpus-informed priority update`.

### What this is NOT

- Not LLM-based. All signals are from files: archive keyword counts, Depends graph traversal, causal graph edges, Hansei severity fields. Same determinism as `arch review`.
- Not automatic. `arch govern` does not call this. It is advisory, human-triggered, like `arch task review`.
- Not a replacement for human judgment. The output is a ranked diff with evidence, not a decision.

## Architectural framing (closed)

**This is a biasing layer, not a truth layer.**

Three tiers, in order of execution speed:

1. **Heurística** (fast ranking) — direct graph signals: fan-out, causal ancestry, age. O(n) over READY queue.
2. **Corpus signal** (bias adjustment) — recurrence in archive. Adjusts heurística output. Does not override it.
3. **Causal graph** (slow correction) — applied only when a signal reaches threshold. Refines, does not replace tier 1.

This separation is a hard invariant. If tiers collapse (e.g., causal graph drives ranking directly), the system becomes globally incoherent — one noisy edge destabilizes everything. Local heurística first; global correction second.

## Design decisions (closed)

**1. Recurrence signal definition (not threshold)**

The problem was under-specified. "Recurrence count" is ambiguous until you define what recurs.

Closed definition: **a recurrence is a match on the same causal entity** — specifically, a `taskId` or label that appears in `.arch/causal-signal.jsonl` edges with the same `category` field as the READY task's class. Keyword similarity is not sufficient; it matches noise. Causal entity match is auditable and deterministic.

Threshold: reuse `WEAK_SIGNAL_THRESHOLD = 3`. No new constant. Introducing a second threshold before the first one has proven insufficient is premature optimization.

**2. Fan-out scope**

Direct dependents only (O(n) over READY queue). No transitive traversal.

Transitive fan-out without exponential decay and a depth cap (≤3) produces unstable ranking — one task near the root of the graph dominates everything. That instability is worse than the lost precision. Transitive can be added later if: (a) decay is defined, (b) depth is capped, (c) subgraphs are cached. Not before.

**3. TASK-954 dependency**

Ship v0 with archive keyword scan against `class` and Hansei `category` fields. TASK-954 (temporal-index label store) improves recall but does not change the architecture — it is a better data source for the same signal, swappable in later. Waiting for infrastructure that isn't built yet is how features never ship.

**4. Low-signal task handling**

Default: **demote priority** (reversible, no friction, recoverable). `BLOCKED` only when: recurrence ≥ `WEAK_SIGNAL_THRESHOLD` AND a confirmed failure pattern exists in Hansei (H0 or H1 with matching category). BLOCKED without that evidence creates an invisible graveyard of tasks that look dead but aren't — exactly the accumulation bias this command is trying to counter.

## Decision

<!-- **Adjudicate by:** [date or "after N THINK reviews"] -->
<!-- PROMOTE → TASK-XXX | REJECT | EXTEND -->
