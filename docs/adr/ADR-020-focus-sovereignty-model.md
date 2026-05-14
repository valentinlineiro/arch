# ADR-020: Focus Sovereignty Model

**Date:** 2026-05-14
**Status:** SUPERSEDED (policy intent retained; execution semantics superseded by AGFM)
**Deciders:** Human Architect, Claude Sonnet 4.6

> **Implementation note:** The ruling vocabulary in §6 was redesigned during implementation.
> `docs/agents/governance-execution-model.md` (AGFM) is the canonical operational contract.
> ADR-020 records the policy decisions and invariants that motivated the design.
> Where ADR-020 and the AGFM conflict on ruling names or execution detail, the AGFM wins.

---

## Context

`arch govern` preserves `Focus:yes` unconditionally once set. A higher-priority task entering the backlog after focus is assigned is ignored until the focused task is archived. This is sticky drift: the system appears to govern but is actually remembering.

`arch review` detects this as `PriorityDrift` — a warning. The warning cannot resolve what it detects. A warning that cannot produce resolution becomes noise, and repeated noise destroys trust in the signal. The current model has no rule for when focus may legitimately be interrupted.

Two problems compound this:

1. **`Focus:yes` is stateless.** The meta line carries no causal history. There is no record of why a task holds focus, when it was assigned, or what authority granted it. Six weeks from now, no audit can reconstruct the legitimacy of the current focus state.

2. **Drift detection and adjudication are unconnected.** `arch review` signals a condition. `arch govern` has no obligation to respond. The circuit is open.

This ADR closes both problems by formalising who has the right to interrupt work, under what conditions, and how every focus transition is recorded.

---

## Decision

### 1. Ledger as source of truth

The meta line `Focus:yes` is a rendered projection, not a source of truth. The source of truth is `.arch/focus-ledger.jsonl`.

No task may hold focus without a traceable acquisition ruling in the ledger. Every focus transition — assignment, preservation, preemption, recovery — is recorded as a ledger entry before any meta line is updated. If the ledger and the meta line disagree, the ledger wins and the discrepancy is a `FocusIntegrityViolation`.

### 2. Govern tick boundary — formal definition

A govern tick is a discrete adjudication transaction, not a wall-clock interval.

**Tick start:** govern reads the full current state snapshot — all task meta lines, the complete `.arch/focus-ledger.jsonl`, and `.arch/escalations.jsonl` — as an atomic read. No state written after this read is visible to the current tick.

**Tick body:** govern evaluates the preemption model against the frozen snapshot. All score computations, violation checks, and ruling decisions are made against this snapshot.

**Tick end:** govern appends all rulings to `.arch/focus-ledger.jsonl` as an atomic write batch. The tick counter `lastCommittedGovernTick` is incremented as the final operation of the batch, after all ruling entries are durable. It is never written mid-batch.

Any state change arriving between tick start and tick end belongs to the next tick.

### 3. ReviewCondition — closed enum

`arch review` is a transaction precondition validator, not an observer. Review failures are blocking. `arch govern` must not adjudicate against an inconsistent review state. Review is the gate; govern is what happens after the gate opens.

`arch review` evaluates only committed ticks — ledger entries at `tick <= lastCommittedGovernTick`. Any govern write batch in progress is invisible. This read is atomic: either the full batch is visible or none of it is.

`arch review` emits exactly one `ReviewCondition` value:

| `ReviewCondition` | Meaning |
|---|---|
| `NONE` | No sovereignty condition detected. Review passes. Gate opens. |
| `FOCUS_SOVEREIGNTY` | An eligible higher-priority READY task exists and no govern ruling covers the current state in the committed ledger. Govern must adjudicate. |
| `FOCUS_INTEGRITY_VIOLATION` | A task holds `Focus:yes` with no lawful acquisition ruling in the committed ledger. |

No other values are valid. If both conditions exist simultaneously, `FOCUS_INTEGRITY_VIOLATION` takes precedence and `FOCUS_SOVEREIGNTY` is suppressed until integrity is restored. Review never emits both.

`arch review` does not evaluate staleness score, protected window state, or preemption layer eligibility. It checks structural conditions only.

**`READY unblocked` is a structural property, not a label.** A task is eligible to trigger `FOCUS_SOVEREIGNTY` only if all three hold in the committed task index: (a) status is `READY`, (b) no `BLOCKED` flag is set, (c) all `Depends:` entries resolve to tasks with `DONE` status. Tasks failing any condition are not candidates.

**`FOCUS_SOVEREIGNTY` is a trigger, not a claim.** It asserts that govern must produce a ruling — not that focus must change. Govern is required to emit exactly one closed ruling for every `FOCUS_SOVEREIGNTY` condition, even when the outcome is `PROTECTED_PRESERVATION`. A `FOCUS_SOVEREIGNTY` with no corresponding ruling in the committed ledger by the next tick is an orphan condition. Orphan conditions are not permitted; they cause review to fail again on the next run.

### 4. Three-layer preemption model

Govern evaluates the following layers in order, stopping at the first conclusive result:

**Layer 1 — Hard Preemption.** Triggers immediately regardless of window or staleness. No exceptions. Applies to:
- Any P0 task in `READY` state
- Any task classified as integrity corruption or provenance corruption
- Any constitutional invariant violation escalation in `.arch/escalations.jsonl`

Ruling emitted: `HARD_PREEMPTION`.

**Layer 2 — Protected Execution Window.** A focused task is immune to soft preemption for the first `protectedWindowTicks` governance ticks after focus assignment (default: 2, configurable in `arch.config.json`). Hard preemption bypasses this layer. If within window:

Ruling emitted: `PROTECTED_PRESERVATION` with `reason: protected_window`.

**Layer 3 — Soft Preemption.** Triggers only when the protected window has expired AND the focused task's staleness score exceeds `stalenessThreshold` (default: 5) AND an eligible candidate strictly outranks the focused task. All three conditions must hold.

Ruling emitted: `SOFT_PREEMPTION`.

If staleness score is below threshold despite window expiry: ruling emitted `PROTECTED_PRESERVATION` with `reason: score_below_threshold`.

### 5. Staleness score — not binary, not git-based

Staleness is a per-task score maintained in the ledger. It is not a flag. Soft preemption triggers when the score exceeds `stalenessThreshold`.

**Progress certification uses a three-source hybrid model, evaluated in order:**

1. **Primary — Meta transition** (machine-verifiable): status field changed, blocked state changed, dependency resolved, Hansei severity reduced, AC checked off (`[ ]` → `[x]`).
2. **Secondary — Artifact completion** (machine-verifiable against filesystem/git): ADR created or updated, new CLI command implemented, validator or test file added, ledger or report file created.
3. **Manual override — Operator assertion**: `arch exec --progress "<reason>"` with a non-empty reason. Produces ruling `STALE_OVERRIDE`. Capped at one delta per tick.

Commits, wall-clock time, and git pulse are never used as progress signals.

**Score table:**

| Event | Delta |
|---|---|
| Tick without any certified transition | +1 |
| Tick with repeated failed execution (same AC failed twice) | +2 |
| Tick with unresolved blocker | +2 |
| H3a escalation entry present in `.arch/escalations.jsonl` | +3 |
| Tick with a validated meta transition | −2 |
| Tick with a validated artifact completion | −1 |
| Operator assertion (`arch exec --progress`) | −1 (capped once per tick) |

Score cannot go below 0.

**Adjudication lock:** Once govern emits a ruling for tick N, the staleness score snapshot used for that ruling is frozen. Escalations arriving after tick N apply their deltas only at tick N+1. The ledger is a court record — verdicts are not amended, only superseded by later rulings.

### 6. Govern ruling types — closed enumeration

Every ledger entry carries a `ruling` field. Free text is permitted only in the supplementary `reason` field — never as a substitute for the ruling value.

| Ruling | Trigger |
|---|---|
| `HARD_PREEMPTION` | Layer 1: P0, integrity/provenance corruption, constitutional violation |
| `SOFT_PREEMPTION` | Layer 3: eligible outranker + stale + window expired |
| `PROTECTED_PRESERVATION` | Layer 2 (window active) or staleness below threshold |
| `STALE_OVERRIDE` | Operator assertion via `arch exec --progress` |
| `MIGRATION_SYNTHESIS` | Synthetic acquisition entry created during pre-sovereignty migration |
| `INTEGRITY_RECOVERY` | `FocusIntegrityViolation` detected and resolved |

No other values are valid. An unrecognised ruling value is a ledger parse error and triggers `FocusIntegrityViolation` on the affected task.

**No operator exceptionalism.** Human intervention enters the system as `STALE_OVERRIDE` or as a priority change that produces `HARD_PREEMPTION`. There is no bypass path. Every focus change is a ruling or it is a violation.

### 7. FocusIntegrityViolation — distinct failure class

`PriorityDrift` is wrong priority. `FocusIntegrityViolation` is wrong legitimacy. They are not the same failure class.

A task has a `FocusIntegrityViolation` when `Focus:yes` exists in the meta line but no lawful acquisition ruling (`HARD_PREEMPTION`, `SOFT_PREEMPTION`, `MIGRATION_SYNTHESIS`, or legacy `focus_assigned`) exists in the committed ledger for that task.

This is constitutional corruption. Govern's mandatory response is `INTEGRITY_RECOVERY`: revoke focus, log to both `.arch/focus-ledger.jsonl` and `.arch/escalations.jsonl`, reassign from top-ranked eligible READY task. `INTEGRITY_RECOVERY` cannot be blocked by operator assertion.

**Migration-synthesized entries are canonical origins — legitimacy is immutable, structure is repairable.**

A `MIGRATION_SYNTHESIS` ruling is a lawful acquisition event. Its legitimacy cannot be challenged by a future `FocusIntegrityViolation` check. If the entry is later found structurally corrupt, `INTEGRITY_RECOVERY` repairs it without reclassifying the original focus as illegitimate. The original ruling is superseded, not deleted.

### 8. Audit trail schema

Each `.arch/focus-ledger.jsonl` entry:

```typescript
{
  taskId: string;           // e.g. "TASK-207"
  ruling: Ruling;           // closed enum (see §6)
  reason: string;           // supplementary free text
  stalenessScore: number;   // score at time of ruling
  tick: number;             // govern tick number (monotonic)
  timestamp: string;        // ISO 8601
  previousTask?: string;    // HARD_PREEMPTION and INTEGRITY_RECOVERY only
  violation?: string;       // INTEGRITY_RECOVERY only: "FocusIntegrityViolation"
  certified_by?: string;    // STALE_OVERRIDE only: "operator"
}
```

The ledger header carries `lastCommittedGovernTick: number`, updated atomically as the final write of each batch.

### 9. Migration path for pre-sovereignty tasks

Existing `Focus:yes` tasks with no ledger entry receive a synthetic `MIGRATION_SYNTHESIS` ruling on the first govern tick after this ADR is deployed, with `reason: "pre-sovereignty-migration"` and `stalenessScore: 0`. No task is silently grandfathered with unknown grounds.

---

## Consequences

**Positive:**
- Focus state is causally traceable. Every `Focus:yes` has a chain of custody.
- `PriorityDrift` becomes escalatory, not advisory. The circuit between detection and resolution is closed.
- `arch review` is deterministic under concurrency: committed ticks only, atomic counter.
- H3a escalations automatically degrade a task's staleness score, surfacing constitutional debt in the scheduling layer.
- Migration does not introduce retroactive violations.

**Negative:**
- `arch govern` now carries adjudication responsibility, not just selection. It must produce a ruling on every tick where a sovereignty condition exists.
- `.arch/focus-ledger.jsonl` must be maintained as an append-only durable ledger. Deletion or truncation constitutes ledger corruption and triggers `FocusIntegrityViolation` on all affected tasks.
- Operator assertions (`arch exec --progress`) are the only sanctioned human intervention path. Informal overrides are violations by definition.

---

## Rejected alternatives

**Warning-only PriorityDrift:** A warning that cannot resolve what it detects normalises drift. Rejected.

**Binary staleness (stale/not-stale):** A flag is gameable by a single commit. Score-based staleness with causal criteria is not. Rejected.

**Git commit as progress signal:** Commit frequency measures activity, not causal advancement. Rejected.

**Free-text ruling field:** Non-enumerable ruling types cannot be computed on. A system that cannot enumerate its own states cannot enforce its own invariants. Rejected.
