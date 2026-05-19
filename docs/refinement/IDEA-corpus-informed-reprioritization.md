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

## Explicit trade-off accepted by design

This system chooses operational stability over epistemological evolution. That is not a neutral choice — it is a deliberate architectural policy with consequences:

- The system is **robust under noise** but **blind to emergent causal entities**.
- It is **predictable** but **not self-correcting** beyond narrow bounds.
- It **assists human judgment** rather than accumulating an autonomous model of the world.

This is the correct choice for v1. Naming it explicitly prevents future maintainers from treating stability constraints as accidental limitations to be removed.

## Invariant taxonomy

Not all invariants are the same kind of thing. Conflating them produces a spec that looks rigorous but isn't.

**Technical invariants** — mathematical guarantees, testable, binary:
- I3, I4, I6

**Epistemological policies** — design choices about whose knowledge takes precedence, not technical guarantees:
- I7 (human recency dominant)
- I1 (closed vocabulary) — a stability policy, not a structural proof

**Proxy heuristics** — useful approximations that acknowledge their own imprecision:
- I2 (scalar threshold for a vector phenomenon)
- I5 (corpus activity gate — measures writing activity, not information arrival; these are not the same)

## Causal Ranking Invariants

**I1 — Vocabulary is closed at runtime, open at deliberate review** *(stability policy)*
Causal entities are `category` strings from a controlled vocabulary in `arch.config.json`. Free-form creation at signal write time is prohibited. Signals with no matching category are recorded as `category: UNCLASSIFIED` — they still count toward corpus activity but do not influence ranking. This bounds drift without permanently freezing the vocabulary. Evolution is governed by IMeta below.

**I2 — Threshold isolation** *(proxy heuristic — acknowledged scalar)*
`CAUSAL_RECURRENCE_THRESHOLD` is a named config field independent of `WEAK_SIGNAL_THRESHOLD`. They may be equal at initialization but are tuned separately. Acknowledged limitation: a single scalar models what is structurally a vector space — recurrence of root cause, recurrence of failure class, and recurrence of causal category are distinct phenomena that a single number conflates. This is a v0 simplification. v1 scope: stratify by signal type.

**I3 — Fan-out depth cap** *(technical invariant)*
Bias score from fan-out aggregates signals at most 1 hop in v0. If transitive traversal is added: decay factor ≤ 0.5 per hop, depth cap ≤ 2, subgraph caching required. Hard cap. Accepted consequence: the system has **short structural memory** — it cannot see failure cascades beyond 2 hops. This is correct by design. The trade-off is stability over systemic sensitivity. Named explicitly so it cannot be rationalized away later.

**I4 — Demotion bound** *(technical invariant)*
A single pass cannot decrease priority by more than one level, except when: recurrence ≥ 2× `CAUSAL_RECURRENCE_THRESHOLD` AND all I6 conditions are met. Under strong evidence, −2 levels in one pass is permitted. This exception exists because the original −1-only rule slows correction under unambiguous evidence — the invariant's purpose is to prevent runaway demotion, not to protect stale estimates.

**I5 — Corpus gate** *(proxy heuristic — acknowledged)*
Priority cannot decrease if the corpus has gained fewer than 3 new entries since the last reprioritization run. Acknowledged limitation: this gates on **writing activity**, not **information arrival**. A burst of unrelated archive entries would unlock demotion even if none of them are causally related to the task in question. Accepted as a v0 proxy; v1 should gate on causally-related entries specifically.

**I6 — BLOCKED is structural** *(technical invariant)*
BLOCKED requires simultaneously: recurrence ≥ `CAUSAL_RECURRENCE_THRESHOLD` AND at least one archived Hansei where `category` exactly matches the READY task's `class` field AND severity ∈ {H0, H1}. All three must be structurally verifiable — no prose matching, no inference. Acknowledged dependency: I6 correctness is bounded by I1 correctness. If the vocabulary mislabels an entity, I6 will produce false blocks. This is a known cascade risk that IMeta is designed to mitigate.

**I7 — Human recency is dominant** *(epistemological policy)*
Corpus bias alone cannot invert the relative order of two tasks whose priorities were set or confirmed by a human within 60 days. Named explicitly as a **policy choice**, not a technical guarantee. Consequence: the system is not autonomous in the strong sense — it accumulates evidence but defers to recent human judgment. This is intentional. ARCH is a biasing layer; it does not yet have the conditions needed to claim epistemic authority over human estimates.

## IMeta — Causal vocabulary evolution

I1 creates stability at the cost of potential causal blindness. IMeta is the mechanism that allows the vocabulary to evolve without degrading into free-form drift.

**Phase 1 — Accumulation**: Signals with no matching category are written as `category: UNCLASSIFIED` to `causal-signal.jsonl`. They are tracked but do not influence ranking.

**Phase 2 — Emergence detection**: When an UNCLASSIFIED cluster reaches ≥ `CAUSAL_RECURRENCE_THRESHOLD` signals sharing the same `class` field (structurally verifiable, no LLM), `arch task reprioritize` emits a secondary cluster report: "N unclassified signals in class X — consider naming a new category." This is advisory output only — the command does not create categories.

**Phase 3 — Human-gated expansion**: A human names the new category, adds it to `arch.config.json`, and commits. A migration pass re-tags the relevant UNCLASSIFIED signals. Migration is a separate `chore:` commit, auditable. Forward signals use the new category immediately; backward migration is explicit and traceable.

IMeta closes the entropy-freezing risk in I1 without opening free-form drift: new categories require accumulated evidence (Phase 2) and a human decision (Phase 3). The system can see emergent entities once they cross threshold — it just cannot name them autonomously.

## Decision

<!-- **Adjudicate by:** [date or "after N THINK reviews"] -->
<!-- PROMOTE → TASK-XXX | REJECT | EXTEND -->
