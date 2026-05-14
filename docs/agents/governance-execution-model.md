# ARCH Governance Execution Model (AGFM)

This document defines the operational execution semantics of the ARCH focus sovereignty
system. It is the canonical contract for the implementation.

See ADR-020 for the policy decisions and invariants that motivated this design.
Where ADR-020 and this document conflict — particularly on ruling vocabulary — this
document takes precedence. ADR-020's ruling names in §6 were redesigned here.

**Guiding principle:** The system decides which task holds focus each tick, using current
state and a simple decision history. Nothing else.

---

## I. State

The system has two state types.

**World State** — mutable, from filesystem.

```typescript
type Task = {
  id:       string;
  status:   'READY' | 'BLOCKED' | 'DONE' | 'IN_PROGRESS';
  priority: number;          // lower number = higher priority (P0 > P1 > P2 > P3)
  depends:  string[];        // task IDs
  focus:    boolean;
}
```

**Decision State** — immutable, append-only, `.arch/focus-ledger.jsonl`.

```typescript
type Ruling = {
  tick:          number;
  taskId:        string;
  action:        'FOCUS_ACQUIRED' | 'FOCUS_PRESERVED' | 'FOCUS_RELEASED' | 'INTEGRITY_FIX';
  previousTask?: string;     // FOCUS_ACQUIRED only
  timestamp:     string;     // ISO 8601
}
```

The ledger header line: `{"meta": true, "lastCommittedTick": N}`

---

## II. Eligibility — binary, now

A task is eligible if and only if, in current World State:

1. `status === 'READY'`
2. `focus === false` (not already focused)
3. All `depends` task IDs have `status === 'DONE'`

Eligibility has no history. It is true or false at the moment of evaluation.

---

## III. Tick — the execution cycle

Each govern invocation executes one tick:

**Step 1 — Read state**
Load all tasks from filesystem. Load ledger. Read `lastCommittedTick`.

**Step 2 — Compute eligible candidates**
Apply §II to all tasks. Sort by priority ascending (P0 first).

**Step 3 — Identify focused task**
The focused task is the most recent `FOCUS_ACQUIRED` in the ledger.
If none exists: focused = null.

**Step 4 — Decide** (see §IV)

**Step 5 — Write ruling to ledger**

**Step 6 — Update World State** (set `focus: true/false` in task meta lines)

**Step 7 — Increment `lastCommittedTick`**

Steps 5-7 execute in this order. If the process is killed between 5 and 7,
recovery restores from the last committed tick (see §VI).

---

## IV. Decision logic

Evaluated in order. Stop at first match.

**Rule 1 — Integrity fix.** If a task has `focus: true` in World State but no
`FOCUS_ACQUIRED` ruling in the ledger: emit `INTEGRITY_FIX`, clear that task's focus,
continue to Rule 2.

**Rule 2 — No current focus.** If focused = null: assign the top eligible candidate.
Emit `FOCUS_ACQUIRED`. Done.

**Rule 3 — Current focus no longer eligible.** If the focused task is not in the
eligible set: emit `FOCUS_ACQUIRED` for top candidate (or `FOCUS_RELEASED` if no
candidate exists). Done.

**Rule 4 — Minimum inercia window.** Count ticks since the last `FOCUS_ACQUIRED` ruling.
If fewer than `minTicksBeforeSwitch` (default: 2, configurable in `arch.config.json`):
emit `FOCUS_PRESERVED`. Done.
Rule 4 protects only valid focus. Rules 1–3 bypass it entirely: an integrity fix,
a missing focus assignment, and a focus task that lost eligibility all act immediately
regardless of inercia window.

**Rule 5 — Priority preemption.** If a candidate C exists with `priority(C) < priority(focused)`:
emit `FOCUS_ACQUIRED` with `previousTask = focused.id`. Done.

**Rule 6 — No change.** Emit `FOCUS_PRESERVED`. Done.

**The minimum inercia window (Rule 4) prevents the scheduler from reacting to every
priority change immediately.** Without it the system is a reactive reflex, not a
scheduler. `minTicksBeforeSwitch = 2` means a focused task gets at least 2 consecutive
ticks before it can be preempted by a soft priority advantage.
Rule 3 (focus no longer eligible) and `INTEGRITY_FIX` bypass the inercia window.

---

## V. What review does

`arch review` reads World State and the committed ledger (entries at
`tick <= lastCommittedTick`). It evaluates two predicates:

**`FOCUS_INTEGRITY_VIOLATION`** — a task has `focus: true` with no `FOCUS_ACQUIRED`
ruling in the committed ledger. Emitted if true.

**`FOCUS_SOVEREIGNTY`** — an eligible task C exists with `priority(C) < priority(focused)`,
AND the number of ticks since the last `FOCUS_ACQUIRED` ruling is `>= minTicksBeforeSwitch`
(i.e., Rule 4 would not prevent preemption at this tick),
AND no `FOCUS_ACQUIRED` ruling for C exists in the committed ledger that was emitted
while C was currently eligible (i.e., C's eligibility was satisfied at the tick of that ruling).
Emitted if true.

This condition mirrors govern's Rules 4+5 exactly — no eligibility history required,
no filesystem diffs, no implicit state. Eligibility is evaluated at the ruling's tick
against the world state govern read at that tick, which is already in the ledger entry.

Review writes nothing. It emits exactly one condition per invocation:
`NONE`, `FOCUS_SOVEREIGNTY`, or `FOCUS_INTEGRITY_VIOLATION`.

---

## VI. Recovery

If interrupted mid-tick:
1. Load ledger. Read `lastCommittedTick`.
2. The current tick is `lastCommittedTick + 1`. Any ledger entries at this tick number
   are uncommitted; discard them.
3. Re-run from Step 2 of the tick cycle against current World State.

The recovery tick may produce a different ruling than the interrupted tick. That is
correct: govern produces a valid ruling for current state, not a replay of the interrupted one.

---

## VII. Configuration

`arch.config.json`:
```json
{
  "minTicksBeforeSwitch": 2
}
```

---

## VIII. What this system is

A deterministic priority scheduler with decision history.

It answers one question each tick: **which task should have focus right now, and why?**

The ledger answers one question for any past tick: **why did govern decide what it decided?**

That is the complete scope of this system.
