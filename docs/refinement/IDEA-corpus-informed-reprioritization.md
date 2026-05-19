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

## Causal Ranking Invariants

These invariants exist to bound the system under corpus evolution. A reprioritization pass that violates any of them is a bug, not a design choice.

**I1 — Entity vocabulary is closed, not free-form**
Causal entities are identified by `category` strings from a controlled vocabulary defined in `arch.config.json`. Free-form category creation at signal write time is prohibited. If a new category is needed, it requires an explicit config change. This prevents the entity registry from fragmenting silently as the corpus grows — "task prioritization bug", "ranking instability", and "feedback loop drift" are three names for the same entity unless the vocabulary says otherwise.

**I2 — Threshold isolation**
`CAUSAL_RECURRENCE_THRESHOLD` is a named, independently tunable config field. It may be initialized to `WEAK_SIGNAL_THRESHOLD` (3), but it is semantically distinct — it governs a specific signal type (causal category recurrence) while the other governs a different layer (weak signal decay). A change to one does not imply a change to the other. Without this separation, future tuning produces silent cross-effects and debugging becomes unreliable.

**I3 — Depth cap on fan-out**
Bias score from fan-out never aggregates signals beyond 1 hop in v0. If transitive traversal is added later, each additional hop must apply a decay factor ≤ 0.5 and depth must be capped at 2. This is a hard cap, not a soft recommendation. The invariant exists because fan-out without decay in a dependency graph converges to "everything affects everything" — which is true but useless for ranking.

**I4 — Demotion bound**
A single reprioritization pass cannot decrease a task's priority by more than one level (P2→P3 is permitted; P1→P3 in one pass is not). The human's original estimate is preserved as a lower bound on velocity. This maintains trazabilidad: if a task is progressively demoted over multiple passes, there is a visible trail. If it drops two levels in one pass, the original signal is effectively erased.

**I5 — Snapshot non-reversal**
A task's priority cannot be decreased by corpus signal alone if either: (a) it was manually set or increased within the last 30 days, or (b) the corpus has gained fewer than 3 new entries since the last reprioritization run. This prevents thrashing on a static corpus — running the command twice on the same day should produce the same output unless new archive entries arrived.

**I6 — BLOCKED is structural, not evaluative**
BLOCKED requires all three conditions to be true simultaneously and structurally verifiable: recurrence ≥ `CAUSAL_RECURRENCE_THRESHOLD` AND at least one archived Hansei entry where `category` field exactly matches the READY task's `class` field AND severity ∈ {H0, H1}. No prose matching, no LLM judgment, no "similar enough." If the category strings do not match exactly, it is not the same entity and BLOCKED is not warranted. This prevents the criterion from becoming political — either the structural match exists or it doesn't.

**I7 — Corpus bias cannot reverse recent human ordering**
If two tasks have different priorities set or confirmed by a human within the last 60 days, corpus bias alone cannot invert their relative order without a new causal signal (≥1 new archive entry referencing both task IDs or their shared category). Human recency is the stronger signal. The system biases, it does not override.

## Decision

<!-- **Adjudicate by:** [date or "after N THINK reviews"] -->
<!-- PROMOTE → TASK-XXX | REJECT | EXTEND -->
