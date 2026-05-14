# ARCH Governance Execution Model (AGFM)

This document defines the formal execution semantics of the ARCH focus sovereignty system.
It is not a decision record — see ADR-020 for policy and invariants.
It is not implementation code — see `govern-system.ts` for that.

It is the artefact that bridges them: a formal model of events, states, and transitions
that both the ADR and the implementation must be consistent with.
If the ADR and the code disagree, consult this document first.

---

## Part I — Event Ontology

The event ontology is the foundation. Every state transition, every automaton input,
every condition emitted by any component is an instance of an event defined here.
No event outside this vocabulary is valid. If a component needs an event not listed here,
the ontology must be extended — not improvised.

### 1.1 Durability classes

Events are either **durable** or **ephemeral**. This distinction is load-bearing.

**Durable events** are written to `.arch/focus-ledger.jsonl` or `.arch/escalations.jsonl`
before they take effect. They persist across process restarts. They are the only source
of truth for reconstructing system state. No durable event is ever deleted — only superseded.

**Ephemeral events** exist only within the execution boundary of a single process invocation.
They are inputs to automata and outputs of detectors. They are never written to disk.
A component that produces only ephemeral events holds no persistent state.

`arch review` produces only ephemeral events. It is a pure function from ledger state to condition.
`arch govern` produces durable events (ruling entries) and consumes both durable and ephemeral inputs.

### 1.2 Observation events — external, detected, ephemeral

These are changes in the world that governance components observe. They are detected
by reading committed state at tick start; they are never stored as events themselves.

| Event | Detected by | Trigger |
|---|---|---|
| `META_STATUS_CHANGED` | govern | Task status field changed in a committed git diff |
| `AC_CHECKED` | govern | `[ ]` → `[x]` in task content in a committed diff |
| `DEPENDENCY_RESOLVED` | govern | A `Depends:` entry task now has status `DONE` in committed index |
| `HANSEI_SEVERITY_REDUCED` | govern | Hansei severity field decreased (e.g. H2 → H1) in committed diff |
| `ARTIFACT_APPEARED` | govern | A file matching artifact completion criteria exists in committed filesystem |
| `H3A_ESCALATION_PRESENT` | govern | An H3a entry exists in `.arch/escalations.jsonl` for the focused task |
| `BLOCKED_STATE_CHANGED` | govern | Task `BLOCKED` flag set or cleared in committed meta |
| `PRIORITY_CHANGED` | govern | Task priority field changed in committed meta |

Observation events are inputs to staleness score computation. They are not inputs to
ruling decisions directly — they become `STALENESS_DELTA` ruling attributes.

### 1.3 Operator events — explicit human action, ephemeral

These are intentional actions taken by a human operator. They are inputs to govern
and become durable only after govern processes them into a ruling.

| Event | Source | Payload |
|---|---|---|
| `OPERATOR_PROGRESS_ASSERTED` | `arch exec --progress "<reason>"` | `reason: string` (non-empty) |
| `REVIEW_INVOKED` | `arch review` CLI invocation | none |
| `GOVERN_INVOKED` | `arch govern` CLI invocation | none |
| `PRIORITY_PROMOTED` | Human edit of task meta priority field | `taskId, oldPriority, newPriority` |

### 1.4 Condition events — review output, ephemeral

These are the sole outputs of `arch review`. They are not written to any file.
They are computed fresh on every review invocation from committed ledger state.
Review holds no memory between invocations.

| Condition | Meaning |
|---|---|
| `REVIEW_CONDITION(NONE)` | No sovereignty condition detected in committed state. Gate opens. |
| `REVIEW_CONDITION(FOCUS_SOVEREIGNTY, candidate, focused)` | An eligible higher-priority READY task exists; no covering ruling in committed ledger. Carries `candidateTaskId`, `candidatePriority`, `focusedTaskId`, `focusedPriority`. |
| `REVIEW_CONDITION(FOCUS_INTEGRITY_VIOLATION, taskId)` | A task holds `Focus:yes` with no lawful acquisition ruling in committed ledger. Carries `taskId`. |

`FOCUS_INTEGRITY_VIOLATION` suppresses `FOCUS_SOVEREIGNTY` when both conditions exist.
Exactly one condition is emitted per review invocation. No other values are valid.

The condition `FOCUS_SOVEREIGNTY` persists structurally — not in memory — until govern
emits a ruling that covers it. Review re-detects it on every invocation by reading the
committed ledger. If no ruling exists at `tick <= lastCommittedGovernTick` that resolves
the structural condition, review emits `FOCUS_SOVEREIGNTY` again. There is no stored
pending state; the ledger is the state.

### 1.5 Durable events — govern output, written to ledger

These are produced by govern as outputs of adjudication. Each is written as a ledger entry
before any meta line is updated. The ledger entry is the authoritative record; the meta line
update follows from it.

| Event | Ruling value | When emitted |
|---|---|---|
| `FOCUS_ACQUIRED` | `HARD_PREEMPTION` | Layer 1 preemption: P0, integrity corruption, constitutional violation |
| `FOCUS_ACQUIRED` | `SOFT_PREEMPTION` | Layer 3 preemption: eligible outranker + stale + window expired |
| `FOCUS_PRESERVED` | `PROTECTED_PRESERVATION` | Layer 2 active (window) or staleness below threshold |
| `FOCUS_CERTIFIED` | `STALE_OVERRIDE` | Operator assertion accepted |
| `FOCUS_SYNTHESIZED` | `MIGRATION_SYNTHESIS` | Pre-sovereignty task receives synthetic acquisition entry |
| `INTEGRITY_RESTORED` | `INTEGRITY_RECOVERY` | `FOCUS_INTEGRITY_VIOLATION` resolved |
| `TICK_COMMITTED` | — | `lastCommittedGovernTick` incremented (final write of batch) |

`TICK_COMMITTED` is the fence event. Everything written before it in the batch is visible
to the next review invocation; nothing written after it is visible to the current one.

### 1.6 Staleness delta — computed attribute, not a separate event

Staleness score change is not an independent event. It is an attribute of the ruling entry
emitted for the tick: `stalenessScore` records the score at the time of ruling, and
`stalenessDeltas` records the observation events that contributed to it.

This means staleness cannot be retroactively revised (the adjudication lock).
The score is a snapshot, not a running total rewritten across entries.

### 1.7 What constitutes "eligible READY" — structural definition

A task is eligible to trigger `FOCUS_SOVEREIGNTY` only if all of the following hold
in the committed task index at the time of review invocation:

1. Status field is `READY`
2. No `BLOCKED` flag is set in the meta line
3. Every task ID listed in `Depends:` has status `DONE` in the committed task index

A task failing any condition is ineligible. Review does not infer, estimate, or assume
future resolution. Eligibility is binary and structural at the moment of evaluation.

### 1.8 Tick boundary — formal definition

A govern tick is a transaction with three strictly ordered phases:

**Phase 1 — Snapshot.** Govern reads all committed state as an atomic snapshot:
all task meta lines, the complete `.arch/focus-ledger.jsonl`, and `.arch/escalations.jsonl`.
This read uses the current value of `lastCommittedGovernTick`. No state written after this
read is visible to the current tick.

**Phase 2 — Adjudication.** Govern evaluates all conditions against the frozen snapshot.
Staleness scores are computed. Ruling decisions are made. No external reads occur in this phase.

**Phase 3 — Commit.** Govern writes all ruling entries to `.arch/focus-ledger.jsonl` as
a single synchronous write. Then it updates all task meta lines. Then it increments
`lastCommittedGovernTick`. This sequence is the commit order; deviation is a govern fault.

**Atomicity boundary.** In the current Node.js single-process implementation,
"atomic" means synchronous and non-concurrent — not ACID in the database sense.
Concurrent govern invocations are not supported; if detected, the second invocation must
abort. A crash during Phase 3 before `lastCommittedGovernTick` is incremented leaves the
ledger in an inconsistent state. Recovery: re-run govern; it will detect the uncommitted
entries (tick number > lastCommittedGovernTick) and either commit or discard them.

---

## Part II — State Projection and Causality Model

The ledger is a decision log. It records rulings — not world state.
World state evolves independently of decisions. A task can change priority, resolve a
dependency, or acquire an H3a escalation without any govern tick occurring.

This part defines the missing layer: how world state is projected at a given tick,
how rulings relate to the state they adjudicated, and what it means for a ruling to
"cover" a current condition.

### 2.1 StateView — world state at a tick

`StateView(tick)` is the projection of the governance-relevant world state at a given
govern tick. It is computed on demand from two sources:

1. **Committed task index at tick**: All task meta lines as they existed at the start
   of the snapshot phase for tick N. This is the mutable world. It includes status,
   priority, blocked flags, dependencies, and focus assignments.

2. **Committed ledger at tick**: All ruling entries at `tick <= N`. This is the
   immutable decision history. Staleness scores, window state, and acquisition history
   are derived from the ledger.

`StateView(tick)` is NOT stored. It is computed fresh at the start of each govern tick
and at the start of each review invocation. It is the input to all evaluation logic.

```
StateView(tick) := {
  focusedTask:         TaskId | null,          // from task index
  eligibleCandidates:  [(TaskId, Priority)],   // structural eligibility (§1.7)
  stalenessScores:     Map<TaskId, Score>,      // derived from ledger + observation events
  windowState:         Map<TaskId, TicksRemaining>,  // derived from ledger
  lastAcquisition:     Map<TaskId, (Ruling, Tick)>   // most recent acquisition ruling per task
}
```

StateView separates the two planes that must not be conflated:
- **World state** — what the tasks look like now (from task index, mutable)
- **Decision history** — what govern has decided (from ledger, immutable)

Staleness scores bridge the planes: they are computed from observation events detected
against the world state, but accumulated through the ledger (each tick's ruling records
the score at adjudication time).

### 2.2 RulingCoverage — when a ruling covers a condition

A ruling covers a sovereignty predicate if and only if all of the following hold:

1. The ruling was emitted at tick R
2. The ruling's `stateSnapshotTick` equals R (i.e., it was made against StateView(R))
3. The candidate task that created the predicate existed and was eligible at StateView(R)
4. No observation event has occurred since tick R that would create a new sovereignty
   predicate — specifically, no new eligible task with higher priority than the focused
   task has become READY since tick R

Condition 4 is the load-bearing rule. It means that a `PROTECTED_PRESERVATION` ruling
at tick 5 does NOT cover a P0 task that became READY at tick 6. The new condition is
uncovered. Review will emit `FOCUS_SOVEREIGNTY` again. Govern must adjudicate again.

**Formal coverage check at review time:**

For each currently eligible higher-priority task C:
- Find the most recent ruling in the committed ledger where C was the triggering candidate
- If no such ruling exists: predicate is uncovered → emit `FOCUS_SOVEREIGNTY`
- If the ruling exists but C's eligibility changed after the ruling (e.g. C became BLOCKED,
  then READY again): the ruling does not cover the current appearance → emit `FOCUS_SOVEREIGNTY`
- If the ruling exists and C's eligibility is continuous since the ruling: predicate is covered

An eligibility change is defined as: any observation event (§1.2) that would have changed
whether C satisfied the §1.7 eligibility criteria between tick R and now.

### 2.3 FOCUS_SOVEREIGNTY as sovereignty predicate — not trigger

A sovereignty predicate is an unresolved obligation for govern to adjudicate.
It is not a trigger (triggers have side-effect semantics). It is not a command.
It is a formal proposition: "there exists an eligible task C of higher priority than
focused task F, and no ruling covers this condition in the committed ledger."

The predicate is true or false. If true, govern has an unresolved obligation.
If false, review emits `NONE`. The obligation's resolution is govern's responsibility;
review's responsibility ends at evaluating the predicate.

This distinction matters in two ways:

1. Review remains a pure function from StateView → ReviewCondition. It produces no side
   effects. The predicate's truth value is the sole output.

2. The obligation is causal, not temporal. It does not expire by elapsed time.
   It resolves only when govern emits a ruling that satisfies the coverage check (§2.2).

Updated condition table — reframed as predicates:

| Predicate | True when |
|---|---|
| `NONE` | No sovereignty predicate is true in StateView(lastCommittedGovernTick) |
| `FOCUS_SOVEREIGNTY(C, F)` | Eligible candidate C has higher priority than focused task F, and no ruling covers C's current eligibility in the committed ledger |
| `FOCUS_INTEGRITY_VIOLATION(F)` | Focused task F has `Focus:yes` in the task index but no lawful acquisition ruling in the committed ledger |

### 2.4 Tick as transaction boundary, not state model

A tick is a transaction boundary. It is not a unit of causal time.

The distinction: between two govern ticks, the world state can change arbitrarily —
tasks can change status, acquire escalations, have dependencies resolved. These changes
are observation events (§1.2) that accumulate in the world. They are not ticks.

A tick is the moment govern reads the accumulated world state, adjudicates, and writes
rulings. The tick counter measures the number of completed adjudication transactions,
not the amount of time elapsed or the amount of world-state change that occurred.

This means:

- Staleness score +1 per tick without certified transition measures **adjudication cycles
  without causal advancement**, not time elapsed. The tick is the operational unit.
  This is not purely causal — it is causal-within-ticks. The system explicitly acknowledges
  that tick frequency is an operational parameter that affects score accumulation rate.

- **Operational invariant (not system invariant):** The tick boundary's atomicity depends
  on single-process sequential execution. It is not a database transaction. It is not
  crash-consistent. If the process is killed mid-Phase 3, ledger entries for that tick
  may be partially written. Recovery: on next govern invocation, detect entries with
  `tick > lastCommittedGovernTick`, treat as uncommitted, discard and re-adjudicate.
  This recovery is correct only if the process is not killed again during the same Phase 3.
  This is the system's known fragility boundary; it does not claim to be stronger than it is.

### 2.5 Ledger integrity classes

The ledger can fail in three distinct ways. These require different responses:

| Failure class | Definition | Recoverable? | Response |
|---|---|---|---|
| **Structural corruption** | Entry is not valid JSON, or is missing required fields | Yes, with data loss risk | `INTEGRITY_RECOVERY`: discard malformed entry, emit repair ruling, re-adjudicate from last clean entry |
| **Semantic corruption** | Entry has valid structure but invalid ruling value or impossible state | Yes | `INTEGRITY_RECOVERY`: supersede with corrected ruling |
| **Legitimacy gap** | `Focus:yes` exists in task index with no acquisition ruling | Yes | `INTEGRITY_RECOVERY`: `FOCUS_INTEGRITY_VIOLATION` → reassign via `MIGRATION_SYNTHESIS` path |
| **Irrecoverable corruption** | Ledger cannot be parsed at all; `lastCommittedGovernTick` unreadable | No — requires human | Nuclear option: delete ledger, run govern with full `MIGRATION_SYNTHESIS` for all `Focus:yes` tasks. Requires explicit human authorisation. This is not an automated recovery path. |

The `MIGRATION_SYNTHESIS` irrevocability rule applies only to legitimacy class:
a `MIGRATION_SYNTHESIS` ruling is proof of lawful focus assignment and cannot be
challenged as illegitimate. If the entry itself is structurally or semantically corrupt
(failure classes 1 or 2), it may be repaired via `INTEGRITY_RECOVERY` without the
repair being treated as a legitimacy challenge.

---

## Part II-b — Causal Identity and Predicate Closure Model

Part II established what StateView is and how rulings relate to world state.
This part defines the four missing causal primitives that make the model stable
under real state evolution: candidate temporal identity, StateView decomposition,
predicate closure conditions, and honest recovery semantics.

### 2b.1 StateView decomposition — three distinct layers

`StateView` is not a single object. It is a projection pipeline over three layers
with different natures, different mutability, and different failure modes.
Collapsing them produces an object where a bug cannot be attributed to its origin.

```
WorldStateSnapshot   — task meta lines at tick start
                       mutable, from filesystem
                       can change between ticks without govern running
                       source of truth for: status, priority, blocked, depends, Focus:yes

DecisionHistoryView  — ledger entries at tick <= lastCommittedGovernTick
                       immutable, append-only
                       source of truth for: ruling history, acquisition events, tick counter

DerivedMetricsView   — computed from WorldStateSnapshot + DecisionHistoryView + observation events
                       not stored, recomputed each tick
                       source of truth for: staleness scores, window state, coverage status
```

When a governance bug occurs, the first diagnostic question is: which layer did it originate in?
- Wrong decision against correct state → DecisionHistoryView or DerivedMetricsView error
- Correct decision against wrong state → WorldStateSnapshot read error
- State and decision correct, metric wrong → DerivedMetricsView derivation error

### 2b.2 CandidateInstance — temporal identity of eligibility

A candidate is not a task. A candidate is a task with a specific, continuous eligibility interval.

```
CandidateInstance(taskId, eligibilityInterval[t_start, t_end | ∞])
```

An eligibility interval begins when all §1.7 criteria become simultaneously true
(status = READY, not BLOCKED, all deps DONE). It ends when any one criterion breaks.
A task that becomes eligible, then blocked, then eligible again has two distinct
candidate instances — not one candidate with a gap.

This matters for coverage. A ruling at tick R covers CandidateInstance(C, [t0, t_end])
only if R falls within [t0, t_end]. If C re-emerges as a new instance after a gap
(new eligibility interval starting at t2 > R), the old ruling does not cover the
new instance. Review will detect the new instance as an uncovered predicate and
emit `FOCUS_SOVEREIGNTY` again.

**Practical implementation:** Eligibility intervals are derived from WorldStateSnapshot
change history (git log of meta line changes). This is expensive to compute fully.
For implementation purposes, a simplified approximation is permitted:

> If the current WorldStateSnapshot shows C as eligible, and the most recent ruling
> in DecisionHistoryView for C was emitted while C was eligible in the committed state
> at that tick, the instance is considered continuous. If C's eligibility was broken
> and restored between the ruling tick and now, coverage does not apply.

This approximation is auditable: any state reconstruction from git history can
retrospectively verify or refute coverage claims.

### 2b.3 Causal closure of sovereignty predicates

A sovereignty predicate `FOCUS_SOVEREIGNTY(C, F)` is causally closed when:

1. A ruling exists in DecisionHistoryView where C was the candidate (i.e., `ruling.candidateTaskId = C`)
2. That ruling was emitted within C's current eligibility interval (§2b.2)
3. No new eligibility event has occurred since the ruling tick that would start a new candidate instance

Condition 3 is the causal closure condition — distinct from coverage (§2.2), which is
about log existence. Closure is about whether the world has evolved beyond what the ruling addressed.

A predicate is **not** causally closed by:
- A ruling that predates C's current eligibility interval
- A ruling that addressed a different candidate D (even if D has the same priority as C)
- Time elapsed without a govern tick (time alone does not close predicates)

If no causally closed ruling exists for C, review emits `FOCUS_SOVEREIGNTY(C, F)`.
The predicate is not closed. Govern must adjudicate.

**Loop condition.** A sovereignty predicate cannot cycle infinitely without state change.
Every govern invocation either produces a ruling (closing the predicate for the current
candidate instance) or detects that the world has changed (creating a new candidate instance
that requires a new ruling). The only scenario where re-detection without closure continues
indefinitely is if govern is never invoked. The system does not self-adjudicate.

### 2b.4 Recovery semantics — explicit non-determinism

Recovery from a partial Phase 3 write is **best-effort reconciliation**, not deterministic replay.

There is no write-ahead log. There is no snapshot hashing. There is no guaranteed idempotent replay.

The recovery procedure is:
1. On govern invocation, read `lastCommittedGovernTick`
2. Find ledger entries with `tick > lastCommittedGovernTick` — these are uncommitted entries
3. Discard them (truncate the ledger to the last committed entry)
4. Re-run Phase 2 adjudication against the current WorldStateSnapshot
5. Write a new ruling batch for the current tick

This is correct under the assumption that Phase 3 produced no observable side effects
(meta line updates) before the process was killed. If meta lines were partially updated
before the kill — which can happen if the process was killed between the ledger write
and the meta line update — the WorldStateSnapshot and DecisionHistoryView will disagree.

In this case, recovery may produce a different ruling than the killed tick would have
produced, because the WorldStateSnapshot now reflects partial meta updates. This is
a known divergence scenario. It does not corrupt the system, but it can produce
a different but equally valid ruling.

**Declaration:** The tick transaction model provides logical atomicity under normal operation.
It does not provide crash consistency. Recovery is best-effort. Silent divergence across
recovery events is possible but bounded: each recovery produces a valid ruling against the
current state; it does not guarantee identity with the killed tick's ruling.

### 2b.5 Specification closure boundary

This model is formally open. Every layer of the model reveals the next missing primitive.
That is correct behavior for specification work — but it is not the same as correctness
criteria for implementation.

The following table distinguishes what is **required for correctness** (the system
produces valid rulings under normal operation) from what is **required for formal completeness**
(the system is provably consistent under all possible state evolutions):

| Element | Required for correctness | Required for formal completeness |
|---|---|---|
| Durable/ephemeral event split | Yes | Yes |
| RulingCoverage for common cases | Yes | Yes |
| CandidateInstance temporal identity | Approximation sufficient | Full interval tracking required |
| StateView decomposition (three layers) | Yes — for auditability | Yes |
| Causal closure condition | Yes — governs re-detection logic | Yes |
| Deterministic crash recovery | No — best-effort is sufficient | Yes (requires WAL) |
| Formal proof of predicate loop termination | No | Yes |

**Implementation decision:** This specification targets correctness, not formal completeness.
The known gaps (deterministic crash recovery, full eligibility interval tracking, formal
termination proof) are documented here as open problems, not as blockers for implementation.
They become blockers only if the system is deployed in a multi-user or high-availability
context — which is outside the current scope (single-user, single-process CLI tool).

Any implementation that satisfies the "required for correctness" column is compliant
with this specification. Any implementation that claims to satisfy the "required for
formal completeness" column must provide evidence for each row.

---

## Part III — FocusStateMachine

_To be written._

---

## Part IV — ReviewState Model

_To be written._

---

## Part V — LedgerTruthModel

_To be written._

---

## Relationship to other documents

| Document | Role |
|---|---|
| ADR-020 | Policy: what exists, who has authority, invariants, ruling enum |
| This document (AGFM) | Execution semantics: events, states, transitions, recovery |
| `govern-system.ts` | Implementation: must be consistent with both |

If ADR-020 and AGFM conflict, the conflict is a design defect — not a implementation choice.
File it as a bug before writing any code that depends on the conflicting section.
