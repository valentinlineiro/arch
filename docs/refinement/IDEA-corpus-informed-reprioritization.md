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

## Open questions

1. **Recurrence threshold** — what count of archive matches justifies a bump? 3 seems reasonable (matches WEAK_SIGNAL_THRESHOLD), but needs a name so it's not a magic number.
2. **Unblock fan-out scoring** — direct dependents only, or transitive? Transitive is more accurate but requires graph traversal. Direct is O(n) over the READY queue.
3. **Integration with TASK-954** — the temporal-index.jsonl label store is the right recurrence source. Should this wait for TASK-954, or use a simpler archive keyword scan as a first pass?
4. **Demotion vs parking** — tasks that score low on all signals: lower their priority, or mark BLOCKED with a note? Demotion is reversible; BLOCKED requires a human unblock. Different semantics.

## Decision

<!-- **Adjudicate by:** [date or "after N THINK reviews"] -->
<!-- PROMOTE → TASK-XXX | REJECT | EXTEND -->
