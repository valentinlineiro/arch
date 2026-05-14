## TASK-247: Focus Sovereignty Model - Constitutional Preemption Engine
**Meta:** P1 | M | READY | Focus:no | 7-operations | local | cli/src/main/ts/application/use-cases/govern-system.ts, docs/agents/
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

- [ ] **ADR-020 written first.** ADR documents: who has the right to interrupt work, the three-layer preemption model, the certified-transition hybrid model, the staleness score table, the closed ruling enumeration, the `ReviewCondition` closed enum, `FocusIntegrityViolation` as a distinct failure class, authority split (review = structural detector only; govern = sole evaluator of staleness/window/precedence), `lastCommittedGovernTick` durability invariant, adjudication lock, tick transaction boundary, and the full audit trail schema. No implementation code is written until ADR-020 is committed.
- [ ] `govern-system.ts` implements the three-layer preemption model:
  - **Layer 1 — Hard Preemption**: P0 tasks, integrity/provenance corruption tasks, constitutional invariant violations always preempt immediately. No protected window. No staleness check. No exceptions.
  - **Layer 2 — Protected Execution Window**: A focused task is immune to soft preemption for the first `protectedWindowTicks` governance ticks after focus assignment (default: 2). Configurable in `arch.config.json`. Hard preemption bypasses this layer.
  - **Layer 3 — Soft Preemption**: Triggers only when all three conditions hold: (a) candidate strictly outranks focused task, (b) focused task staleness score exceeds `stalenessThreshold`, (c) protected window has expired.
- [ ] Staleness score is computed from the three-source hybrid model above. Git commit timestamps and commit counts are never used as progress signals.
- [ ] `arch exec --progress "<reason>"` appends a certified transition to `.arch/focus-ledger.jsonl` with `certified_by: operator` and reduces staleness score by 1 for the current tick. Requires a non-empty reason string.
- [ ] `.arch/focus-ledger.jsonl` is append-only. Each entry records: `taskId`, `ruling` (closed enum), `reason` (free text, supplementary), `stalenessScore`, `tick`, `timestamp`. Entries carrying `HARD_PREEMPTION` or `INTEGRITY_RECOVERY` also carry `previousTask`. Entries carrying `INTEGRITY_RECOVERY` also carry `violation: "FocusIntegrityViolation"`.
- [ ] The `ruling` field accepts exactly: `HARD_PREEMPTION`, `SOFT_PREEMPTION`, `PROTECTED_PRESERVATION`, `STALE_OVERRIDE`, `MIGRATION_SYNTHESIS`, `INTEGRITY_RECOVERY`. Any other value is a ledger parse error.
- [ ] `arch review` detects `FocusIntegrityViolation`: any task with `Focus:yes` in the meta line that has no corresponding acquisition ruling (`HARD_PREEMPTION`, `SOFT_PREEMPTION`, `MIGRATION_SYNTHESIS`, `focus_assigned`) in the ledger causes an immediate `arch review` failure, independent of priority or staleness score.
- [ ] Govern responds to `FocusIntegrityViolation` with `INTEGRITY_RECOVERY`: revoke focus, log to both `.arch/focus-ledger.jsonl` and `.arch/escalations.jsonl`, reassign to top-ranked READY task. `INTEGRITY_RECOVERY` cannot be blocked by operator assertion.
- [ ] There is no operator bypass path. Human intervention enters the system as `STALE_OVERRIDE` (via `arch exec --progress`) or as a task priority change that triggers `HARD_PREEMPTION`. The word "bypass" does not exist in the govern vocabulary.
- [ ] **Adjudication lock is enforced.** Once govern has emitted a ruling for tick N, the staleness score used in that ruling cannot be retroactively changed. H3a entries and other escalations appended after tick N apply their deltas only starting at tick N+1. The ledger entry for tick N is immutable after govern's write batch for that tick completes.
- [ ] **Tick boundary is a transaction.** Govern reads all state (task meta lines, focus-ledger, escalations) as a single atomic snapshot at tick start. All decisions are made against that snapshot. All rulings are written as a single atomic batch at tick end. State arriving between snapshot read and ruling write is invisible to the current tick.
- [ ] **`arch review` evaluates committed ticks only.** Review reads `lastCommittedGovernTick` from the ledger header before scanning any entries. It evaluates state at `tick <= lastCommittedGovernTick`. Any in-progress govern write batch is invisible to the current review run. This eliminates mid-tick phantom failures.
- [ ] **`arch review` is a transaction precondition validator.** Review failures are blocking. `arch govern` must not adjudicate against an inconsistent review state.
- [ ] **`arch review` emits exactly one `ReviewCondition` value — closed enum:** `NONE`, `FOCUS_SOVEREIGNTY`, `FOCUS_INTEGRITY_VIOLATION`. If both conditions exist, `FOCUS_INTEGRITY_VIOLATION` takes precedence and suppresses `FOCUS_SOVEREIGNTY`. Review never emits both simultaneously. No other value is valid.
- [ ] **`READY unblocked` eligibility is structural.** A task is eligible to trigger `FOCUS_SOVEREIGNTY` only if: status is `READY`, no `BLOCKED` flag is set, and all `Depends:` entries resolve to `DONE` in the committed task index. Tasks failing eligibility are not candidates and do not trigger `FOCUS_SOVEREIGNTY`. Review evaluates eligibility structurally — no inference, no staleness.
- [ ] **`FOCUS_SOVEREIGNTY` is a trigger, not a claim.** Govern must emit exactly one closed ruling for every `FOCUS_SOVEREIGNTY` condition, even when the result is `PROTECTED_PRESERVATION`. A `FOCUS_SOVEREIGNTY` with no corresponding ruling in the committed ledger by the next tick is an orphan condition and causes review to fail again. Orphan conditions are not permitted.
- [ ] **`lastCommittedGovernTick` durability invariant.** The counter is updated as the final atomic write of each govern batch, after all ruling entries are durable. It is never written mid-batch. Any read of `lastCommittedGovernTick` observes a consistent state: either the batch is fully committed and the counter reflects it, or the batch is not yet committed and the counter does not. No partial visibility exists between the counter and the entries it covers.
- [ ] **`MIGRATION_SYNTHESIS` legitimacy is immutable; structure is repairable.** No `FocusIntegrityViolation` check may challenge a focus state established by `MIGRATION_SYNTHESIS`. If the entry is later found structurally corrupt, `INTEGRITY_RECOVERY` repairs it without revoking its legitimacy. The original ruling is superseded, not deleted.
- [ ] H3a escalation in `.arch/escalations.jsonl` adds +3 to staleness score for the focused task on the next govern tick. This is automatically applied — no manual step required.
- [ ] `arch review` emits `FOCUS_SOVEREIGNTY` and **fails** when a higher-priority READY unblocked task exists with no covering govern ruling in the committed ledger. Staleness threshold and protected window are not evaluated by review. Silent preservation is not permitted — govern must produce a ledger ruling before review will emit `NONE`.
- [ ] There is no silent preservation path. Every govern tick where focus is preserved under drift conditions must produce a ledger entry with a closed ruling. A missing entry is treated as a govern fault and causes `FOCUS_SOVEREIGNTY` on the next review run.
- [ ] Migration path is explicit: existing `Focus:yes` tasks without a ledger entry are assigned a synthetic `focus_assigned` entry on first govern tick after deployment, with `reason: "pre-sovereignty-migration"` and `stalenessScore: 0`. No task is silently grandfathered with unknown grounds.

### Definition of Done

- [ ] ADR-020 committed before any implementation file is modified.
- [ ] `arch govern` with a stale P2 task (score > threshold, window expired) and a P1 candidate correctly soft-preempts.
- [ ] `arch govern` with a P0 READY task hard-preempts regardless of protected window or staleness score.
- [ ] `arch govern` within the protected window preserves focus even when candidate outranks and score is above threshold.
- [ ] `arch exec --progress "reason"` reduces staleness score by 1 and is logged with `certified_by: operator`.
- [ ] `.arch/focus-ledger.jsonl` contains a complete, auditable trail for all focus changes and score mutations.
- [ ] Unit tests cover all three preemption layers, the staleness score table, the H3a +3 path, the operator assertion path (`STALE_OVERRIDE`), `FocusIntegrityViolation` detection and `INTEGRITY_RECOVERY` response, and rejection of unknown ruling values.
- [ ] `arch review` emits `FOCUS_SOVEREIGNTY` and fails on the current state (P1 TASK-245 and TASK-247 unblocked while P2 TASK-207 focused, no covering govern ruling in committed ledger) — validates the structural condition check fires on real data. Staleness and window are not factors in this check.
- [ ] `.arch/focus-ledger.jsonl` exists after first govern tick and contains a traceable entry for every focus-holding task.
- [ ] `arch govern` output explicitly states the adjudication decision (preempted | preserved + reason) on every tick where PriorityDrift conditions are active.

## Hansei
**Severity:** H0
**Category:** [SymbolDiscovery]

**Decision:**
No implementation decisions made yet — this Hansei entry is a structural placeholder required by the validator for READY tasks that have not started implementation.

**Constraint:**
Validator requires structured Hansei on all tasks regardless of lifecycle phase; this is a known false-positive for READY tasks where no technical decisions have been taken.

**Cost:**
Placeholder fields carry no semantic weight; cost will be reassessed at REVIEW time when actual implementation tradeoffs are known.

**Forward Action:**
none
