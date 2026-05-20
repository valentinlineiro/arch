# Sprint State Machine Design
<!-- Established: 2026-05-20 | TASK-960 | Design doc for TASK-957 implementation -->
<!-- Re-entry index:
     "What state is the sprint in?"                  → §State Model
     "Which oracle is authoritative for X?"          → §Source of Truth
     "What may arch govern read/write/not touch?"    → §Authority Boundary
     "Is govern idempotent on the sprint path?"      → §Idempotency Proof
     "What does a transition emit?"                  → §Transition Table
     "How are duplicate events prevented?"           → §Event Identity
     "How does govern recover from a crash?"         → §Crash Recovery -->

## Purpose

This document is the design contract for implementing automatic sprint lifecycle in `arch govern` (TASK-957). It resolves the two structural failures identified in TASK-957's gap analysis: the absence of a formal state model and the absence of a single source of truth.

**Scope:** Design only. No code changes. TASK-957 implements against this contract.

---

## State Model

A sprint has four states. Each state corresponds to one committed event step — not an in-memory phase.

```
ACTIVE ──close trigger──▶ CLOSING ──SPRINT_CLOSE committed──▶ CLOSED
  ▲                                                               │
  │                                                      SPRINT_OPEN(next) committed
  │                                                               │
  └──────────────── ACTIVE ◀── completion step ── OPENING ◀──────┘
```

**Rule:** One govern tick may emit multiple events, but they are applied sequentially. No atomic multi-state assumption exists. Any step may be the last before a crash — the system must remain consistent at each commit boundary.

### ACTIVE

The current sprint is in flight. Tasks are archived against it.

**Invariants:**
- Exactly one sprint is ACTIVE at any time.
- A `SPRINT_OPEN` event for this sprint exists in the ledger with no subsequent `SPRINT_CLOSE` for the same `sprint_id`.
- `arch.config.json#currentSprint` is a read-only cache of the most recent committed `SPRINT_OPEN` event. It is not authoritative.
- `archivedSinceOpen` = count of `TASK_ARCHIVED` events in the ledger where `sprintId == currentSprint`. No timestamp arithmetic. No state inference.

### CLOSING

The close trigger has been evaluated as true. `arch govern` is in the process of committing the `SPRINT_CLOSE` event.

**Invariants:**
- This state is not persisted. It exists between the decision to close and the ledger commit.
- If govern crashes here, the ledger has no `SPRINT_CLOSE` — the system is still effectively ACTIVE on restart.

### CLOSED

`SPRINT_CLOSE` has been committed to the ledger. The retro has been written. No new sprint is open yet.

**Invariants:**
- A `SPRINT_CLOSE` event for this sprint exists in the ledger.
- A retro record for this `sprint_id` exists in `docs/RETRO.md` (written in the same step as `SPRINT_CLOSE`; if missing, re-derive on next tick).
- `arch.config.json#currentSprint` still names this sprint — it is not updated until `SPRINT_OPEN(next)` is committed.

### OPENING

`arch govern` is in the process of committing `SPRINT_OPEN` for the next sprint.

**Invariants:**
- This state is not persisted. It exists between the decision to open and the ledger commit.
- If govern crashes here, the ledger has `SPRINT_CLOSE` but no `SPRINT_OPEN(next)` — the system is in CLOSED state on restart and will complete the open on the next tick (see §Crash Recovery).

---

## Transition Table

| From | To | Trigger | Emits | Writes |
|---|---|---|---|---|
| — | ACTIVE | Bootstrap: ledger has no `SPRINT_OPEN` | `SPRINT_OPEN(config#currentSprint)` | ledger entry, config (bootstrap only) |
| ACTIVE | CLOSED | `archivedSinceOpen >= sprintCloseAfterN` | `SPRINT_CLOSE(currentSprint)` | ledger entry, `docs/RETRO.md` overwrite |
| CLOSED | OPENING | Detected: `SPRINT_CLOSE` exists, no `SPRINT_OPEN(next)` | `SPRINT_OPEN(nextSprint)` | ledger entry, `arch.config.json#currentSprint` |
| OPENING | ACTIVE | `SPRINT_OPEN(next)` committed | *(none)* | *(state is now readable from ledger)* |

**Close trigger:** `archivedSinceOpen` = count of `TASK_ARCHIVED` ledger events where `sprintId == currentSprint`. Purely event-based — no timestamp arithmetic, no filesystem scan.

**After first `SPRINT_OPEN` is committed:** `arch.config.json#currentSprint` is a cache only. All lifecycle decisions read from the ledger. Config writes occur only on `SPRINT_OPEN`.

**Next sprint name:** `sprint/v{major}.{minor}.{patch+1}` derived from `arch.config.json#version`. If version is not semver-parseable, fall back to `sprint/{currentSprint}-next`.

---

## Source of Truth

The ledger is the single authoritative source for all sprint lifecycle state. Everything else is derived.

| Field | Authoritative Oracle | Notes |
|---|---|---|
| Sprint name (current) | `.arch/focus-ledger.jsonl` (last `SPRINT_OPEN`) | Config is bootstrap-only cache |
| Sprint open timestamp | `.arch/focus-ledger.jsonl` (`SPRINT_OPEN` event) | — |
| Sprint close timestamp | `.arch/focus-ledger.jsonl` (`SPRINT_CLOSE` event) | — |
| Archive count since open | `.arch/focus-ledger.jsonl` (`TASK_ARCHIVED` events) | Count where `sprintId == currentSprint` |
| Retro record | `docs/RETRO.md` | Projection; re-derivable from ledger |
| Task state | `docs/tasks/` filesystem | — |

**Arbitration rule:** If the ledger contains any `SPRINT_OPEN` event, the ledger is the sole authority for current sprint name. `arch.config.json#currentSprint` is ignored for lifecycle decisions — it is updated by govern as a cache and may be read by external tooling, but it is never read back to make sprint state decisions.

**Bootstrap exception (one-time only):** If the ledger contains no `SPRINT_OPEN` event, govern uses `arch.config.json#currentSprint` to emit the first `SPRINT_OPEN`. After that event is committed, config authority ends permanently.

**`docs/RETRO.md` is a projection, not a source.** It must not be read to reconstruct sprint state. If RETRO and ledger disagree, the ledger is correct and RETRO is regenerated from ledger data.

---

## Event Identity

Every sprint lifecycle event has a deterministic identity:

```
event_id = hash(type + sprint_id)
```

Where `type` is `SPRINT_OPEN` or `SPRINT_CLOSE` and `sprint_id` is the sprint name string.

**Deduplication rule:** The ledger must reject any event whose `event_id` already exists. This is enforced at write time — before appending, govern checks for an existing entry with the same `event_id`. If found, the write is skipped silently.

**Idempotency checks use `event_id`, not semantic search.** Govern must not scan for "any SPRINT_OPEN after timestamp X" to determine whether to emit — it checks whether `event_id(SPRINT_OPEN, sprintId)` exists in the ledger. This makes deduplication O(1) and crash-safe.

---

## Authority Boundary

`arch govern` is the sole writer on the sprint path. Everything else is read-only.

| Operation | Permitted | Prohibited |
|---|---|---|
| Read `arch.config.json#currentSprint` | ✓ | — |
| Read `arch.config.json#sprintCloseAfterN` | ✓ | — |
| Write `arch.config.json#currentSprint` | ✓ (on `SPRINT_OPEN` commit only) | Any other write; reading it for lifecycle decisions after first `SPRINT_OPEN` |
| Append `SPRINT_OPEN` to ledger | ✓ (checked against `event_id` first) | — |
| Append `SPRINT_CLOSE` to ledger | ✓ (checked against `event_id` first) | — |
| Write retro record to `docs/RETRO.md` | ✓ (on `SPRINT_CLOSE` commit; overwrite by `sprint_id`) | Reading RETRO to determine sprint state |
| Read task archive for velocity | ✓ | — |
| Mutate task files on sprint path | — | ✗ strictly prohibited |
| Delete or rewrite ledger entries | — | ✗ strictly prohibited |
| Invoke THINK for retro | — | ✗ (THINK retro is advisory; govern writes the deterministic record) |

**Govern must assume partial execution is normal.** Sprint operations are not atomic. Any step may be the last before a crash. Govern recovers by replaying ledger state on the next tick — see §Crash Recovery.

**Govern is not allowed to block on sprint operations.** If a sprint close or open fails (e.g., config write fails), govern must log the failure to `docs/INBOX.md`, continue the tick, and retry on the next tick. Sprint lifecycle is non-blocking with respect to focus management.

---

## Idempotency Proof

A function `f` is idempotent if `f(f(x)) = f(x)` for all `x`.

`arch govern` is idempotent on the sprint path because every write is guarded by an `event_id` check. All idempotency checks use `event_id = hash(type + sprint_id)`, not semantic search over timestamps or state inference.

**Proof by case:**

**Case 1: Sprint is ACTIVE, close trigger not met.**
Govern computes `archivedSinceOpen` from `TASK_ARCHIVED` events. Trigger not met — no write attempted. Second run: same ledger, same count, same result. ✓

**Case 2: Sprint is ACTIVE, close trigger met.**
Govern emits `SPRINT_CLOSE(currentSprint)` (guarded by `event_id`), writes RETRO (overwrite by `sprint_id`), then emits `SPRINT_OPEN(nextSprint)` (guarded by `event_id`), updates config.
Second run: `event_id(SPRINT_CLOSE, currentSprint)` exists — write skipped. Govern now sees the new sprint as ACTIVE with `archivedSinceOpen = 0`. Close trigger not met. No write. ✓

Note: SPRINT_CLOSE and SPRINT_OPEN are separate sequential commits. A crash between them leaves the system in CLOSED state — see §Crash Recovery.

**Case 3: Bootstrap (no prior SPRINT_OPEN in ledger).**
Govern checks `event_id(SPRINT_OPEN, config#currentSprint)` — not found. Emits `SPRINT_OPEN`. Second run: `event_id` found — write skipped. ✓

**Idempotency invariant:** Every ledger write is preceded by an `event_id` lookup. If the `event_id` exists, the write is skipped. RETRO is always overwritten deterministically by `sprint_id` — no "exists check" required, no skip logic needed.

---

## Crash Recovery

Govern must assume partial execution is normal and recover via ledger replay. The following incomplete states are valid intermediates and must be handled:

**`SPRINT_OPEN` without `SPRINT_CLOSE` (normal ACTIVE state or OPENING crash):**
- If `SPRINT_OPEN(A)` exists and no `SPRINT_CLOSE(A)` exists: sprint A is ACTIVE. Normal operation.
- If `SPRINT_OPEN(A)` exists and `SPRINT_OPEN(B)` also exists (B ≠ A): B is the current sprint. Sprint A is closed. Check for `SPRINT_CLOSE(A)` — if missing, it is a gap but not a blocking error. RETRO for A may be regenerated from ledger data.

**`SPRINT_CLOSE` without subsequent `SPRINT_OPEN` (crash in OPENING):**
- Govern detects: most recent sprint has `SPRINT_CLOSE` but no new `SPRINT_OPEN` follows it.
- Recovery: emit `SPRINT_OPEN(nextSprint)` immediately on next tick. RETRO is re-entrant — overwrite by `sprint_id` is a no-op if already written, or re-derives if missing.

**`SPRINT_OPEN` exists but `arch.config.json#currentSprint` is stale:**
- Config is ignored. Ledger is authoritative. Govern updates config as part of the `SPRINT_OPEN` step.

**Repair rule:** On every tick, govern checks ledger consistency before running the close-trigger evaluation:
1. If last sprint has `SPRINT_CLOSE` but no `SPRINT_OPEN(next)`: emit `SPRINT_OPEN(next)` and stop.
2. If RETRO is missing for a closed sprint: regenerate and write.
3. Otherwise: normal close-trigger evaluation.

---

## Retro Record Contract

A retro record is a deterministic projection — a pure function of available state at close time.

```
retro_record = f(sprint_id, open_ts, close_ts, archived_tasks, velocity_by_size)
```

**Format (appended to `docs/RETRO.md`):**

```markdown
## Sprint: {sprint_id}
- **Opened:** {open_ts ISO 8601}
- **Closed:** {close_ts ISO 8601}
- **Tasks archived:** {count}
- **Velocity by size:** XS:{n} S:{n} M:{n} L:{n} XL:{n}
- **Source:** deterministic | arch govern {version}
```

**Write strategy: overwrite-by-sprint_id.** The retro record for a given `sprint_id` is always rewritten deterministically from ledger data. No "exists check" and no skip logic — the same inputs always produce the same output. This makes RETRO re-entrant and crash-safe without requiring idempotency guards. THINK may append a `### THINK Commentary` subsection — advisory only; it is not part of the canonical record and is preserved across overwrites.

---

## Implementation Notes for TASK-957

1. **Schema change:** Add `sprintCloseAfterN: number` to `arch.config.json` (default: 15). Requires ADR-026 before schema change (protected path).

2. **Ledger extension:** Extend `focus-ledger.ts` with `SprintEvent`:
   ```typescript
   interface SprintEvent {
     type: 'SPRINT_OPEN' | 'SPRINT_CLOSE';
     sprintId: string;
     event_id: string;  // hash(type + sprintId)
     timestamp: string; // ISO 8601
   }
   ```
   Also add `TASK_ARCHIVED` event with `sprintId` field so `archivedSinceOpen` can be computed from ledger alone — no filesystem scan.

3. **Pure service:** `govern-system.ts` calls `SprintLifecycleService.tick(ledgerState, config)` which returns `{ eventsToEmit, configMutations, retroToWrite }`. The service is pure — no filesystem I/O. It runs the repair check first (§Crash Recovery steps 1–3), then the close-trigger evaluation.

4. **Write discipline:** All filesystem writes (ledger append, config update, RETRO overwrite) happen in `govern-command.ts` after the service returns, in this order: ledger → config → RETRO. Each write is committed individually. Crash at any point leaves a recoverable state.

5. **`event_id` check before every ledger write.** Deduplication is the caller's responsibility — `SprintLifecycleService` returns events to emit; `govern-command.ts` checks `event_id` before each append.
