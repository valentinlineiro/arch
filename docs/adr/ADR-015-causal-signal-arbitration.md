# ADR-015: Causal Signal Arbitration Layer

**Status:** ACCEPTED
**Date:** 2026-05-11
**Task:** TASK-225

## Context

ADR-014 established the causal graph as an append-only JSONL of human-asserted and system-inferred edges. That design handles `CausalGraph → AskCorpus` influence (forward direction), but not `AskCorpus → CausalGraph` (backward learning). Without a feedback path, the graph becomes frozen truth: coherent but epistemologically rigid under new evidence.

The system needed a backward loop that does not collapse uncertainty prematurely and remains auditable and reproducible.

## Decision

Introduce a two-layer epistemic architecture:

**Layer 1 — Signal layer (`.arch/causal-signal.jsonl`):** Append-only observation records. Generated automatically by lifecycle events (task completion, recurrence detection, govern violations). Never directly consumed by queries. Signals are *hypotheses*, not *facts*.

**Layer 2 — Graph layer (`.arch/causal-graph.jsonl`):** The existing committed truth store. Mutated only via explicit arbitration — never at event time. Queries read only this layer.

Arbitration runs at `arch review` time (and on demand via `arch causal arbitrate`). It consumes pending signals, applies the two invariants below, and either commits graph mutations or records conflicts for human review.

## Two Invariants (System Contracts)

### Query Isolation Invariant

> A query must always operate over a single epistemic state snapshot: committed graph at time T. Signals are invisible to queries until the next arbitration commit.

Rationale: mixing committed graph state with unresolved pending signals creates hybrid state — two simultaneous realities. Any partial signal visibility would introduce non-deterministic query results across review cycles.

Enforcement: `causalRelevance()` and all graph-reading query paths reference only `causal-graph.jsonl`. No code path from `causal-signal.jsonl` to query scoring exists.

### Arbitration Determinism Invariant

> Two arbitration runs on identical signal input must produce identical graph mutations. The result cannot depend on signal insertion order, concurrent writes, or iteration order.

Enforcement: signals are sorted before evaluation by `timestamp ASC`, then `domain priority` (ontological < epistemological < normative), then `id` lexicographically. Grouping by candidate `(from, relation, to)` collapses before evaluation. Conflict resolution is computed per group, not across groups.

## Signal Lifecycle

```
created → pending (review_count=0)
per review cycle, if not consumed:
  review_count += 1
  if review_count >= EXPIRY_CYCLES (default: 3): → stale
consumed via:
  cross-domain corroboration (reinforce/create): → applied → graph mutation
  cross-domain contradiction (reinforce+weaken): → conflicted → human review queue
  expiry (no corroboration in window):           → stale → historical record only
```

Signal domains and auto-apply rules:
- `ontological` (task_completed): eligible for cross-domain corroboration
- `epistemological` (recurrence detection): eligible for cross-domain corroboration
- `normative` (govern violation): never auto-applied; expires normally; surfaces as human review hint

## Consequences

- The graph contains only arbitrated truth. Uncertainty is explicit in the signal layer.
- Stale signals are historical observations: "system noticed something it could not confirm."
- Conflicts are explicit records: "system cannot decide — human review needed."
- Schema drift in the signal layer does not affect graph queries.
- `EXPIRY_CYCLES` is configurable in `arch.config.json` under `causal.signalExpiryReviews`.
