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

## Part II — FocusStateMachine

_To be written after Event Ontology is reviewed._

---

## Part III — ReviewState Model

_To be written after Event Ontology is reviewed._

---

## Part IV — LedgerTruthModel

_To be written after Event Ontology is reviewed._

---

## Relationship to other documents

| Document | Role |
|---|---|
| ADR-020 | Policy: what exists, who has authority, invariants, ruling enum |
| This document (AGFM) | Execution semantics: events, states, transitions, recovery |
| `govern-system.ts` | Implementation: must be consistent with both |

If ADR-020 and AGFM conflict, the conflict is a design defect — not a implementation choice.
File it as a bug before writing any code that depends on the conflicting section.
