# ARCH Governance Execution Model (AGFM)

This document defines the operational execution semantics of the ARCH focus sovereignty
system. It is not a decision record — see ADR-020 for policy and invariants. It is the
bridge between ADR-020 and `govern-system.ts`.

**Guiding principle:** The ledger is the only causal source of truth.
The filesystem is current state. Review reads. Govern writes. Nothing else has causal authority.

---

## I. Two states, nothing more

The system has exactly two state types.

**World State** — mutable, from filesystem.
Tasks: status, priority, blocked, depends, Focus:yes/no.
This is current reality. It has no historical authority.

**Decision State** — immutable, append-only, from `.arch/focus-ledger.jsonl`.
This is causal history. It is the only thing that explains the past.
Every focus transition ever made by govern lives here.

No other state exists with causal authority.

---

## II. Two event classes, nothing more

**Observations** — derived from World State on demand.
Examples: task became READY, dependency resolved, task blocked.
These are inputs to govern's decision logic. They are NOT stored.
Observations have no independent existence; they are computed fresh each tick.

**Rulings** — emitted by govern, appended to the ledger.
Examples: `FOCUS_ACQUIRED`, `FOCUS_PRESERVED`, `INTEGRITY_RESTORED`.
These ARE stored. They are the system. The ledger is the sequence of rulings.

---

## III. StateView — what govern reads

At the start of each tick, govern reads:

```
StateView := {
  currentFocusedTask:  TaskId | null,      // from World State
  eligibleTasks:       [(TaskId, Priority)], // from World State (see §IV)
  ledgerHistory:       Ruling[],            // from Decision State
  worldSnapshot:       TaskMeta[]           // raw World State
}
```

This is computed once per tick at tick start. It is not stored. It is the complete
input to the decision phase. Govern makes all decisions against this snapshot.
No additional reads occur during the decision phase.

---

## IV. Eligibility — binary, structural, now

A task is eligible if and only if all three hold in the current World State:

1. `status == READY`
2. `blocked == false`
3. All task IDs in `Depends:` have `status == DONE` in World State

Eligibility is evaluated at the moment of the tick snapshot. It has no history.
There are no eligibility intervals. There are no candidate instances.
A task is eligible now or it is not.

---

## V. FOCUS_SOVEREIGNTY — the one condition that matters

`FOCUS_SOVEREIGNTY` is present when:

- There exists an eligible task C such that `priority(C) > priority(focusedTask)`
- AND no ruling exists in `ledgerHistory` that resolves this condition

Translation: something better is ready, and the system has not addressed it yet.

`FOCUS_INTEGRITY_VIOLATION` is present when:

- `currentFocusedTask` has `Focus:yes` in World State
- AND no acquisition ruling (`FOCUS_ACQUIRED` or `MIGRATION_SYNTHESIS`) exists in `ledgerHistory` for that task

If both are present, `FOCUS_INTEGRITY_VIOLATION` takes precedence.

`arch review` evaluates these two predicates against `StateView` and emits exactly one:
`NONE`, `FOCUS_SOVEREIGNTY`, or `FOCUS_INTEGRITY_VIOLATION`. Review writes nothing.

---

## VI. Govern — the only writer

**Input:** `StateView`
**Output:** 0..N rulings appended to ledger, then World State updated

**Decision logic — evaluated in order, stop at first match:**

1. `FOCUS_INTEGRITY_VIOLATION` present → emit `INTEGRITY_RESTORED`, reassign focus, stop
2. Hard preemption candidate exists (P0, integrity corruption class) → emit `FOCUS_ACQUIRED(HARD)`, stop
3. Within protected window (first `protectedWindowTicks` ticks since last `FOCUS_ACQUIRED`) → emit `FOCUS_PRESERVED(PROTECTED_WINDOW)`, stop
4. `FOCUS_SOVEREIGNTY` present AND staleness score > threshold → emit `FOCUS_ACQUIRED(SOFT)`, stop
5. Otherwise → emit `FOCUS_PRESERVED(NO_PREEMPTION_CONDITION)`

**Staleness score** is an integer stored in the most recent ruling for the focused task.
It is updated each tick by observation deltas (see ADR-020 §5 for the delta table).
It is not a separate data structure. It lives in the ledger as a field on ruling entries.

---

## VII. Tick — sequential execution, not a transaction

A tick is a sequential execution unit:

1. Read `StateView` from filesystem + ledger
2. Run decision logic against `StateView`
3. Append ruling(s) to ledger
4. Update World State (task meta lines)
5. Increment `lastCommittedGovernTick`

**What this guarantees:** sequential consistency within a single process. No concurrent
govern invocations are supported. If two invocations occur simultaneously, behaviour is
undefined — callers must prevent this.

**What this does NOT guarantee:** crash consistency, atomicity in the database sense,
or deterministic recovery.

---

## VIII. Recovery — converge from current state

If govern is interrupted mid-tick (crash between steps 3 and 5):
- On next invocation, ledger entries with `tick > lastCommittedGovernTick` exist
- Discard them (they are uncommitted)
- Re-evaluate from current `StateView`
- Produce a new ruling for the current tick

The new ruling may differ from the discarded one. That is correct: govern produces
a valid ruling for current state, not a replay of the interrupted one.

**There is no "lost truth."** The discarded entries were not committed. The system
converges to a valid new state. Historical continuity between the interrupted tick
and the recovery tick is not guaranteed — and not required.

---

## IX. Ruling schema

```typescript
type Ruling = {
  taskId:        string;
  ruling:        'FOCUS_ACQUIRED' | 'FOCUS_PRESERVED' | 'INTEGRITY_RESTORED' | 'MIGRATION_SYNTHESIS';
  reason:        string;           // free text, supplementary
  layer?:        'HARD' | 'SOFT' | 'PROTECTED_WINDOW' | 'NO_PREEMPTION_CONDITION';
  stalenessScore: number;
  tick:          number;
  timestamp:     string;           // ISO 8601
  previousTask?: string;           // FOCUS_ACQUIRED only
  violation?:    string;           // INTEGRITY_RESTORED only
}
```

`lastCommittedGovernTick` is stored as the first line of `focus-ledger.jsonl`:
```jsonl
{"meta": true, "lastCommittedGovernTick": 5}
{"taskId": "TASK-207", "ruling": "FOCUS_PRESERVED", ...}
```

---

## X. What this system is

A priority arbitration scheduler with decision history.

Not: a formal causal system.
Not: a temporal state machine with complete history.
Not: a crash-consistent distributed ledger.

It is: a scheduler that records why it made each decision, so that drift can be detected
and adjudicated on the next tick.

---

## Relationship to other documents

| Document | Role |
|---|---|
| ADR-020 | Policy: ruling enum, authority split, invariants |
| This document (AGFM) | Execution semantics: what govern reads, decides, and writes |
| `govern-system.ts` | Implementation: must be consistent with both |
