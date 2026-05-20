# Sprint State Machine Design
<!-- Established: 2026-05-20 | TASK-960 | Design doc for TASK-957 implementation -->
<!-- Re-entry index:
     "What state is the sprint in?"                  → §State Model
     "Which oracle is authoritative for X?"          → §Source of Truth
     "What may arch govern read/write/not touch?"    → §Authority Boundary
     "Is govern idempotent on the sprint path?"      → §Idempotency Proof
     "What does a transition emit?"                  → §Transition Table -->

## Purpose

This document is the design contract for implementing automatic sprint lifecycle in `arch govern` (TASK-957). It resolves the two structural failures identified in TASK-957's gap analysis: the absence of a formal state model and the absence of a single source of truth.

**Scope:** Design only. No code changes. TASK-957 implements against this contract.

---

## State Model

A sprint has three states:

```
ACTIVE ──close trigger──▶ CLOSED ──next-open──▶ NEXT_PENDING ──tick──▶ ACTIVE
  ▲                                                                         │
  └─────────────────── (initial open at bootstrap) ────────────────────────┘
```

### ACTIVE

The current sprint is in flight. Tasks may be archived against it.

**Invariants:**
- Exactly one sprint is ACTIVE at any time.
- `arch.config.json#currentSprint` names this sprint.
- A `SPRINT_OPEN` event for this sprint exists in the ledger.
- The open timestamp is the `timestamp` field of that event.
- The archive count (`archivedSinceOpen`) is computable from the ledger: count of DONE tasks archived after the open timestamp.

### CLOSED

The sprint has met its close trigger. The retro has been written. No new sprint is open yet.

**Invariants:**
- A `SPRINT_CLOSE` event for this sprint exists in the ledger.
- A retro record keyed by `sprint_id` exists in `docs/RETRO.md`.
- `arch.config.json#currentSprint` still names this sprint (not updated until NEXT is opened).
- No tasks may be archived against a CLOSED sprint in `arch govern` output — the next sprint's `SPRINT_OPEN` event must appear in the same tick before any subsequent archival.

### NEXT_PENDING

The next sprint has been named and opened. The system is in transition. This state is transient — it exists within a single `arch govern` tick and does not persist across ticks.

**Invariants:**
- A `SPRINT_OPEN` event for the *next* sprint has been appended to the ledger.
- `arch.config.json#currentSprint` has been updated to the new sprint name.
- This state resolves to ACTIVE at the end of the same govern tick.

---

## Transition Table

| From | To | Trigger | Emits | Writes |
|---|---|---|---|---|
| — | ACTIVE | Bootstrap (first govern tick, no prior SPRINT_OPEN) | `SPRINT_OPEN` | `arch.config.json#currentSprint`, ledger entry |
| ACTIVE | CLOSED | `archivedSinceOpen >= sprintCloseAfterN` | `SPRINT_CLOSE` | ledger entry, `docs/RETRO.md` append |
| CLOSED | NEXT_PENDING | Same tick as CLOSED | `SPRINT_OPEN` (next sprint) | `arch.config.json#currentSprint`, ledger entry |
| NEXT_PENDING | ACTIVE | End of same govern tick | *(none)* | *(none — state resolves in memory)* |

**Close trigger:** `archivedSinceOpen` is derived from the ledger — count of `SPRINT_CLOSE`-absent ticks where a task was archived after the most recent `SPRINT_OPEN` timestamp. It is not stored; it is computed on each tick.

**Next sprint name:** `sprint/v{major}.{minor}.{patch+1}` derived from `arch.config.json#version`. If version is not semver-parseable, fall back to `sprint/{currentSprint}-next`.

---

## Source of Truth

The system currently has four implicit oracles. This document designates authority explicitly.

| Field | Authoritative Oracle | Derivable From |
|---|---|---|
| Sprint name (current) | `arch.config.json#currentSprint` | — |
| Sprint open timestamp | `.arch/focus-ledger.jsonl` (`SPRINT_OPEN` event) | — |
| Sprint close timestamp | `.arch/focus-ledger.jsonl` (`SPRINT_CLOSE` event) | — |
| Archive count (since open) | `.arch/focus-ledger.jsonl` (derived, not stored) | Open timestamp + archived task log |
| Retro record | `docs/RETRO.md` | Ledger + archive (projection) |
| Task state | `docs/tasks/` filesystem | — |

**Arbitration rule:** When `arch.config.json#currentSprint` and the ledger disagree about the current sprint name, the ledger wins. The config is a cache of the last committed `SPRINT_OPEN` event. If the ledger has no `SPRINT_OPEN` event, the config is authoritative (bootstrap case).

**`docs/RETRO.md` is a projection, not a source.** It is derived from the ledger and archive at close time. It must not be read to reconstruct sprint state. If RETRO and ledger disagree, the ledger is correct; RETRO should be regenerated.

---

## Authority Boundary

`arch govern` is the sole writer on the sprint path. Everything else is read-only.

| Operation | Permitted | Prohibited |
|---|---|---|
| Read `arch.config.json#currentSprint` | ✓ | — |
| Read `arch.config.json#sprintCloseAfterN` | ✓ | — |
| Write `arch.config.json#currentSprint` | ✓ (on SPRINT_OPEN only) | Writing during ACTIVE state |
| Append `SPRINT_OPEN` to ledger | ✓ | — |
| Append `SPRINT_CLOSE` to ledger | ✓ | — |
| Append retro record to `docs/RETRO.md` | ✓ (on SPRINT_CLOSE only) | Modifying existing retro entries |
| Read task archive for velocity | ✓ | — |
| Mutate task files on sprint path | — | ✗ strictly prohibited |
| Delete or rewrite ledger entries | — | ✗ strictly prohibited |
| Invoke THINK for retro | — | ✗ (THINK retro is advisory; govern writes the deterministic record) |

**Govern is not allowed to block on sprint operations.** If a sprint close or open fails (e.g., config write fails), govern must log the failure to `docs/INBOX.md`, continue the tick, and retry on the next tick. Sprint lifecycle is non-blocking with respect to focus management.

---

## Idempotency Proof

A function `f` is idempotent if `f(f(x)) = f(x)` for all `x`.

`arch govern` must be idempotent on the sprint path — running it twice in the same state must produce the same result as running it once.

**Proof by case:**

**Case 1: Sprint is ACTIVE, close trigger not met.**
Govern reads the sprint name and archive count. Neither write to config nor ledger is triggered. Second run: same reads, same result. ✓

**Case 2: Sprint is ACTIVE, close trigger met.**
Govern emits `SPRINT_CLOSE` and `SPRINT_OPEN`, writes RETRO, updates config. Second run: the ledger now contains `SPRINT_CLOSE` and `SPRINT_OPEN` events. The close trigger is re-evaluated against the *new* sprint's archive count (zero). Close trigger not met. No write. ✓

**Case 3: Sprint is CLOSED (SPRINT_CLOSE emitted, SPRINT_OPEN not yet emitted — partial write).**
This state arises only on crash between the two ledger writes. On next run: govern detects `SPRINT_CLOSE` without subsequent `SPRINT_OPEN`. It emits `SPRINT_OPEN` to complete the transition. RETRO write is guarded by `sprint_id` key — if already written, it is a no-op (append-only, keyed, duplicate-skipped). ✓

**Case 4: Bootstrap (no prior SPRINT_OPEN in ledger).**
Govern emits `SPRINT_OPEN` for `arch.config.json#currentSprint`. Second run: `SPRINT_OPEN` already exists for this sprint. No duplicate emitted — guarded by: emit only if ledger has no `SPRINT_OPEN` for `currentSprint`. ✓

**Idempotency invariant:** Every ledger write is guarded by a prior read that checks for existence. `SPRINT_OPEN(sprint_id)` is only emitted if no `SPRINT_OPEN` for that `sprint_id` exists. `SPRINT_CLOSE(sprint_id)` is only emitted if a `SPRINT_OPEN` exists and no `SPRINT_CLOSE` exists. RETRO append is keyed by `sprint_id` and skipped if already present.

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

Append-only. Keyed by sprint_id. If a record for this sprint_id already exists, the write is skipped (idempotent). THINK may append a `### THINK Commentary` subsection under the record — this is advisory and does not replace or modify the canonical record.

---

## Implementation Notes for TASK-957

1. Add `sprintCloseAfterN: number` to `arch.config.json` schema (default: 15). Requires ADR-026 before schema change.
2. Extend `focus-ledger.ts` with `SprintEvent` type: `{ type: 'SPRINT_OPEN' | 'SPRINT_CLOSE', sprintId: string, timestamp: string }`. Add to `LedgerState`.
3. `govern-system.ts` calls `SprintLifecycleService.tick(ledgerState, config, archiveCount)` which returns the new events and mutations to apply. The service is pure — no filesystem I/O inside it — enabling unit testing without mocks.
4. All filesystem writes (ledger append, config update, RETRO append) happen in `govern-command.ts` after the service returns. This preserves the architecture's read-then-write discipline.
