## TASK-247: Focus Sovereignty Model - Constitutional Preemption Engine
**Meta:** P1 | M | REVIEW | Focus:no | 7-operations | local | cli/src/main/ts/application/use-cases/govern-system.ts, docs/agents/
**Depends:** none

### Context

`arch govern` currently preserves `Focus:yes` unconditionally once set. A P1 task added after a P2 task is focused is ignored until the P2 task is archived. This is sticky drift: the system appears to govern but actually just remembers.

The fix is not simply "switch on higher priority". Without a protected execution window and a staleness score grounded in causal advancement (not git activity), the system either drifts or oscillates. Both are failure modes.

**ADR-first constraint:** The ADR must be written and committed before any implementation code is touched. The principle precedes the code — not the other way around.

#### PriorityDrift is escalatory, not advisory

`PriorityDrift` detected by `arch review` is not a warning. When the drift threshold is exceeded it is a constitutional failure that requires govern adjudication on the next tick. Govern either preempts or logs an explicit reason why it preserves. There is no silent preservation path.

A warning that cannot resolve what it detects is noise. Repeated unresolved warnings destroy trust in the signal. `arch review` must fail — not warn — when drift exceeds the threshold and the protected window has expired.

**Authority split — review detects, govern resolves, committed ticks only.**

`arch review` is the sensor and the blocker. `govern` is the adjudicator and the resolver. Their responsibilities do not overlap.

`arch review` evaluates only committed ticks. `lastCommittedGovernTick` is a monotonically increasing counter written as the final operation of each govern write batch, after all ruling entries are durable. It is never updated mid-batch. Any read of `lastCommittedGovernTick` is atomic — no partial state is visible between its update and the entries that precede it. Review reads this counter once at start and evaluates only ledger entries at `tick <= lastCommittedGovernTick`. Govern write batches in progress are invisible.

This eliminates the mid-tick race unconditionally: govern's tick N is either fully committed (visible) or not committed at all (invisible). There is no partial visibility window.

**`arch review` is a transaction precondition validator, not an observer.** Review failures are blocking system state transitions. `arch govern` must not proceed to adjudication if review is inconsistent — an inconsistent review means the system's structural preconditions are unmet, and any ruling produced against an inconsistent state is unsafe. Review is the gate. Govern is what happens after the gate opens.

**`arch review` emits exactly one of three `ReviewCondition` values — nothing else:**

| `ReviewCondition` | Meaning |
|---|---|
| `NONE` | No sovereignty condition detected. Review passes. Gate opens. |
| `FOCUS_SOVEREIGNTY` | An eligible higher-priority READY task exists and no govern ruling covers the current state in the committed ledger. Govern must adjudicate. |
| `FOCUS_INTEGRITY_VIOLATION` | A task holds `Focus:yes` with no lawful acquisition ruling in the committed ledger. |

`ReviewCondition` is a closed enum. No other values are valid. `FOCUS_SOVEREIGNTY` and `FOCUS_INTEGRITY_VIOLATION` are mutually exclusive — if both conditions exist simultaneously, `FOCUS_INTEGRITY_VIOLATION` takes precedence and `FOCUS_SOVEREIGNTY` is suppressed until integrity is restored. Review never emits both.

**`READY unblocked` is a structural property, not a label.** For a task to be eligible to trigger `FOCUS_SOVEREIGNTY`, it must satisfy all of the following in the committed ledger state: (a) status is `READY`, (b) no `BLOCKED` flag is set, (c) all entries in `Depends:` resolve to tasks with `DONE` status in the committed task index. A task that is `READY` by label but has unresolved dependencies or an internal blocked state is not eligible. Review evaluates eligibility structurally — it does not infer, estimate, or apply staleness. If a task fails eligibility, it is not a candidate and does not trigger `FOCUS_SOVEREIGNTY`.

`arch review` does not evaluate staleness score, protected window state, or preemption layer eligibility. It does not compute whether drift threshold is exceeded. Govern receives the `ReviewCondition` and applies the full precedence evaluation.

**`FOCUS_SOVEREIGNTY` is a trigger, not a claim.** It does not assert that focus must change — it asserts that govern must produce a ruling. Govern is required to emit exactly one closed ruling for every `FOCUS_SOVEREIGNTY` condition, even if the result is `PROTECTED_PRESERVATION`. A `FOCUS_SOVEREIGNTY` condition with no corresponding govern ruling in the committed ledger on the next tick is an orphan condition and causes review to fail again. There are no orphan conditions. Every trigger closes with a ruling.

**FocusSovereignty evaluation precedence (govern only, triggered by `FOCUS_SOVEREIGNTY`):**
1. Hard preemption eligibility (P0, integrity corruption, constitutional violation) — overrides all layers
2. Protected execution window — if active, emit `PROTECTED_PRESERVATION`, stop
3. Staleness score vs threshold — if below threshold, emit `PROTECTED_PRESERVATION` with reason `score_below_threshold`, stop
4. Drift condition (eligible candidate outranks focused) — emit `SOFT_PREEMPTION`

#### Reason-for-focus ledger

Every `Focus:yes` assignment requires an explicit reason recorded in `.arch/focus-ledger.jsonl`. No task may hold focus without a traceable adjudication entry. Six weeks from now the audit trail must answer: who assigned focus, on what grounds, and what was the staleness score at that moment.

Example entries:

```jsonl
{"taskId":"TASK-207","event":"focus_preserved","reason":"protected_window","stalenessScore":1,"tick":3,"timestamp":"2026-05-14T12:00:00Z"}
{"taskId":"TASK-245","event":"focus_preempted","layer":"hard","source":"integrity_corruption","previousTask":"TASK-207","stalenessScore":4,"tick":4,"timestamp":"2026-05-14T13:00:00Z"}
```

The meta line `Focus:yes` is a projection of the ledger's last `focus_assigned` or `focus_preempted` entry. The ledger is the source of truth; the meta line is a cache.

#### FocusIntegrityViolation — a distinct failure class

PriorityDrift is wrong priority. `FocusIntegrityViolation` is wrong legitimacy. They are not the same thing and must not be merged.

A task has a `FocusIntegrityViolation` when `Focus:yes` exists in the meta line but no lawful acquisition event — a ruling of `HARD_PREEMPTION`, `SOFT_PREEMPTION`, `MIGRATION_SYNTHESIS`, or a legacy `focus_assigned` entry — can be found in `.arch/focus-ledger.jsonl` for that task. The cause does not matter — manual edit, merge conflict corruption, partial state write, migration defect. The result is the same: the system holds a focus state it cannot justify.

**Migration-synthesized entries are canonical origins — legitimacy is immutable, structure is repairable.**

A `MIGRATION_SYNTHESIS` ruling is a lawful acquisition event. Its legitimacy cannot be challenged by a future `FocusIntegrityViolation` check. The presence of the ruling is proof that focus was lawfully assigned at migration time — no future auditor may override that determination.

However, legitimacy and structural integrity are separate properties. If ledger corruption is later detected (e.g. the entry is structurally malformed, has an invalid ruling value, or is missing required fields), the entry may be repaired via `INTEGRITY_RECOVERY` without reclassifying the original focus as illegitimate. The repair ruling records what was corrected and why, preserving the chain of custody. The original `MIGRATION_SYNTHESIS` ruling is not deleted — it is superseded by the repair entry, which inherits its legitimacy.

This prevents two failure modes: migration triggering the violation class it was designed to forestall, and a corrupt ledger becoming immutably valid by hiding behind migration immunity.

This is constitutional corruption, not scheduling disagreement. It must be treated as a hard-preemption-class event:
- `arch review` fails immediately on detection, regardless of priority or staleness score.
- Govern's response is `INTEGRITY_RECOVERY`: revoke focus, log the violation, trigger synthetic reassignment from top-ranked READY task.
- The violation entry is appended to `.arch/escalations.jsonl` as well as the ledger.

`FocusIntegrityViolation` cannot be silenced by operator assertion. The only resolution is govern running `INTEGRITY_RECOVERY`.

#### Govern ruling types — closed enumeration

Every ledger entry carries a `ruling` field. The value must be one of the following closed set. Free text is permitted only in the additional `reason` string alongside the ruling — never as a substitute for it.

| Ruling | Meaning |
|---|---|
| `HARD_PREEMPTION` | Layer 1 trigger: P0, integrity corruption, constitutional violation |
| `SOFT_PREEMPTION` | Layer 3 trigger: outranked + stale + window expired |
| `PROTECTED_PRESERVATION` | Layer 2 active: within minimum execution window |
| `STALE_OVERRIDE` | Operator assertion accepted (`arch exec --progress`) |
| `MIGRATION_SYNTHESIS` | Synthetic entry created for pre-sovereignty task |
| `INTEGRITY_RECOVERY` | FocusIntegrityViolation detected and resolved |

No other ruling values are valid. An unrecognised ruling value is treated as a ledger parse error and triggers `FocusIntegrityViolation` on the affected task.

**No operator exceptionalism.** A human who needs to override govern's decision must do so through `arch exec --progress` (producing a `STALE_OVERRIDE` ruling) or by explicitly promoting a task to P0 (producing `HARD_PREEMPTION`). There is no bypass path. There is no `reason: "seemed better"`. Every focus change is a ruling or it is a violation.

Updated ledger entry examples:

```jsonl
{"taskId":"TASK-207","ruling":"PROTECTED_PRESERVATION","reason":"tick 1 of 2 in protected window","stalenessScore":0,"tick":1,"timestamp":"2026-05-14T12:00:00Z"}
{"taskId":"TASK-245","ruling":"HARD_PREEMPTION","reason":"P0 integrity corruption task","previousTask":"TASK-207","stalenessScore":4,"tick":2,"timestamp":"2026-05-14T13:00:00Z"}
{"taskId":"TASK-209","ruling":"INTEGRITY_RECOVERY","reason":"Focus:yes with no acquisition event found in ledger","violation":"FocusIntegrityViolation","tick":3,"timestamp":"2026-05-14T14:00:00Z"}
```

#### Who certifies a validated state transition

Progress certification uses a three-source hybrid model, evaluated in this order:

1. **Primary — Meta transition** (machine-verifiable, append to `focus-ledger.jsonl` automatically):
   - Status field changed (e.g. `IN_PROGRESS` → `REVIEW`, `READY` → `BLOCKED`)
   - Blocked state changed (blocker added or resolved)
   - Dependency resolved (a `Depends:` entry moved to DONE)
   - Hansei severity reduced (e.g. H2 → H1 in a subsequent commit)
   - Execution phase advanced (AC checked off in a commit — `[ ]` → `[x]`)

2. **Secondary — Artifact completion** (machine-verifiable against filesystem/git):
   - ADR file created or updated
   - New command implemented (new entry in CLI dispatch)
   - Validator or test file added
   - Report or ledger file created

3. **Manual override — Explicit operator assertion**:
   - `arch exec --progress "<reason>"` certifies one tick of progress
   - Requires a Hansei trace: the reason is appended to `.arch/focus-ledger.jsonl` with `certified_by: operator`
   - Never primary. Never silent. Always auditable.

**Rule:** If none of the three sources can certify progress for a tick, the tick counts as stale. The system never infers progress from git pulse, commit count, or wall-clock time alone.

#### Staleness score (not binary)

Staleness is a score, not a flag. Soft preemption triggers when score exceeds `stalenessThreshold` (default: 5).

| Event | Score delta |
|---|---|
| Tick without any certified transition | +1 |
| Tick with repeated failed execution (same AC failed twice) | +2 |
| Tick with unresolved blocker | +2 |
| H3a escalation entry present in `.arch/escalations.jsonl` | +3 |
| Tick with a validated meta transition | -2 |
| Tick with a validated artifact completion | -1 |
| Manual operator assertion (`arch exec --progress`) | -1 (capped: max once per tick) |

Score cannot go below 0. Score is stored per-task in `.arch/focus-ledger.jsonl` and recomputed on each govern tick.

**Adjudication lock — rulings are temporally immutable.** Once govern emits a ruling for tick N, the staleness score used for that ruling is frozen. Any escalation that arrives after tick N (e.g. an H3a entry appended between ticks) applies its delta only to tick N+1. Govern does not retroactively revise a ruling it has already emitted. The ledger is a court record: verdicts are not amended, only superseded by later rulings. Without this invariant the system can rewrite its own history, which destroys auditability.

#### Govern tick boundary — formal definition

A govern tick is not wall-clock time and not a cron interval. It is a discrete adjudication event with a defined boundary:

**Tick start:** govern reads the full current state snapshot — all task meta lines, the complete `.arch/focus-ledger.jsonl`, and `.arch/escalations.jsonl` — as an atomic read. No state written after this read is visible to the current tick.

**Tick body:** govern evaluates the three-layer preemption model against the snapshot. All score computations, violation checks, and ruling decisions are made against the frozen snapshot.

**Tick end:** govern appends all rulings to `.arch/focus-ledger.jsonl` as an atomic write batch. The tick number increments after the write completes. Any state change that arrives between the start read and the end write belongs to the next tick.

This boundary is what makes the adjudication lock meaningful. A tick is a transaction: read snapshot, decide, write rulings, advance tick counter. The ruling is valid for the state that existed at tick start — not the state that exists when a future reader inspects the ledger.

### Acceptance Criteria

- [x] ADR-020 written and committed before any implementation code is touched.
- [x] AGFM (`docs/agents/governance-execution-model.md`) written and committed; defines the operational execution model that `govern-system.ts` must implement.
- [x] `govern-system.ts` implements the AGFM tick cycle (§III): read state → compute eligible candidates → identify focused task → decide → write ruling → update World State → increment `lastCommittedTick`.
- [x] Eligibility is evaluated per AGFM §II: `status === 'READY'`, not blocked, all depends resolved. No other criteria.
- [x] Decision logic follows AGFM §IV rules in order: integrity fix → no focus → focus lost eligibility → inercia window → priority preemption → preserve.
- [x] `minTicksBeforeSwitch` (default: 2) is read from `arch.config.json`. Governs the inercia window in Rule 4.
- [x] Ledger entries use the schema in AGFM §I: `tick`, `taskId`, `action` (`FOCUS_ACQUIRED` | `FOCUS_PRESERVED` | `FOCUS_RELEASED` | `INTEGRITY_FIX`), `previousTask?`, `timestamp`.
- [x] `arch review` detects `FOCUS_INTEGRITY_VIOLATION` (focused task with no `FOCUS_ACQUIRED` ruling in committed ledger) and `FOCUS_SOVEREIGNTY` (eligible higher-priority candidate exists AND inercia window has expired). Emits exactly one of `NONE`, `FOCUS_SOVEREIGNTY`, `FOCUS_INTEGRITY_VIOLATION`. Writes nothing.
- [x] `arch review` reads only committed ledger entries (at `tick <= lastCommittedTick`). Ruling entries at tick > lastCommittedTick are ignored.
- [x] Recovery: on govern invocation, discard any ledger entries at tick > `lastCommittedTick`, then re-run tick cycle from current state.
- [x] Migration: on first govern tick after deployment, any task with `Focus:yes` in World State and no `FOCUS_ACQUIRED` ruling in ledger receives an `INTEGRITY_FIX` ruling (not MIGRATION_SYNTHESIS — it is a correction, not a synthesis).
- [x] `arch govern` output states the ruling emitted each tick: task ID, action, reason.
- [x] Unit tests cover: no-focus assignment, priority preemption after inercia window, inercia window preservation, integrity fix, no-candidate case, eligibility filter (blocked, unresolved deps).

### Definition of Done

- [x] `arch govern` assigns focus to TASK-245 (P1) when TASK-207 (P2) has been focused for ≥ `minTicksBeforeSwitch` ticks.
- [x] `arch govern` preserves TASK-207 focus when fewer than `minTicksBeforeSwitch` ticks have elapsed, even with TASK-245 in the eligible set.
- [x] `arch govern` immediately reassigns when the focused task loses eligibility (becomes BLOCKED or moves to IN_PROGRESS by another path).
- [x] `arch review` emits `FOCUS_SOVEREIGNTY` on current state (TASK-245 and TASK-247 unblocked while TASK-207 focused, inercia window expired, no covering ruling).
- [x] `.arch/focus-ledger.jsonl` exists and contains a ruling entry for every govern tick run.
- [x] All unit tests pass. `arch review` passes after a clean govern tick.

## Hansei
**Severity:** H1
**Category:** [SpecDrift]

**Decision:**
ADR-020 and AGFM diverge on ruling vocabulary: ADR uses HARD_PREEMPTION/SOFT_PREEMPTION/PROTECTED_PRESERVATION while AGFM uses FOCUS_ACQUIRED/FOCUS_PRESERVED/INTEGRITY_FIX. Implementation follows AGFM (simpler, machine-computable). ADR-020 is a policy document written before the AGFM was simplified; its ruling names are aspirational, not implemented. The in-memory task focus flag becomes stale after INTEGRITY_FIX in a tick — resolved by tracking fixed IDs and treating them as focus=false for the eligible computation within the same tick.

**Constraint:**
ADR-020 cannot be retroactively updated to match implementation without a new commit touching a protected path (docs/adr/). The divergence is visible to any future auditor who reads both documents.

**Cost:**
An auditor reading ADR-020 ruling names (HARD_PREEMPTION etc.) and then reading focus-ledger.jsonl (FOCUS_ACQUIRED etc.) will see a mismatch. This is a documentation debt, not a functional defect. The AGFM is the canonical execution model.

**Forward Action:**
Add a note to ADR-020 §6 clarifying that ruling names were simplified in the AGFM; the AGFM is authoritative for implementation. File as IDEA for a follow-up reconciliation pass if the divergence causes confusion during future audits.
