## TASK-247: Focus Sovereignty Model - Constitutional Preemption Engine
**Meta:** P1 | M | READY | Focus:no | 7-operations | local | cli/src/main/ts/application/use-cases/govern-system.ts, docs/agents/
**Depends:** none

### Context

`arch govern` currently preserves `Focus:yes` unconditionally once set. A P1 task added after a P2 task is focused is ignored until the P2 task is archived. This is sticky drift: the system appears to govern but actually just remembers.

The fix is not simply "switch on higher priority". Without a protected execution window and a staleness score grounded in causal advancement (not git activity), the system either drifts or oscillates. Both are failure modes.

**ADR-first constraint:** The ADR must be written and committed before any implementation code is touched. The principle precedes the code — not the other way around.

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

### Acceptance Criteria

- [ ] **ADR-020 written first.** ADR documents: who has the right to interrupt work, the three-layer preemption model, the certified-transition hybrid model, the staleness score table, and the audit trail schema. No implementation code is written until ADR-020 is committed.
- [ ] `govern-system.ts` implements the three-layer preemption model:
  - **Layer 1 — Hard Preemption**: P0 tasks, integrity/provenance corruption tasks, constitutional invariant violations always preempt immediately. No protected window. No staleness check. No exceptions.
  - **Layer 2 — Protected Execution Window**: A focused task is immune to soft preemption for the first `protectedWindowTicks` governance ticks after focus assignment (default: 2). Configurable in `arch.config.json`. Hard preemption bypasses this layer.
  - **Layer 3 — Soft Preemption**: Triggers only when all three conditions hold: (a) candidate strictly outranks focused task, (b) focused task staleness score exceeds `stalenessThreshold`, (c) protected window has expired.
- [ ] Staleness score is computed from the three-source hybrid model above. Git commit timestamps and commit counts are never used as progress signals.
- [ ] `arch exec --progress "<reason>"` appends a certified transition to `.arch/focus-ledger.jsonl` with `certified_by: operator` and reduces staleness score by 1 for the current tick. Requires a non-empty reason string.
- [ ] `.arch/focus-ledger.jsonl` is append-only. Each entry records: `taskId`, `event` (`focus_assigned` | `meta_transition` | `artifact_completion` | `operator_assertion` | `focus_preempted` | `focus_preserved`), `reason`, `stalenessScore`, `tick`, `timestamp`.
- [ ] When govern preempts focus it logs a `focus_preempted` entry stating which layer triggered (hard | soft), the candidate task, and the staleness score at time of preemption.
- [ ] When govern preserves focus it logs a `focus_preserved` entry with the reason (protected_window | rank_sufficient | score_below_threshold).
- [ ] H3a escalation in `.arch/escalations.jsonl` adds +3 to staleness score for the focused task on the next govern tick. This is automatically applied — no manual step required.
- [ ] `arch review` gains a `FocusSovereignty` check: warns when a P1+ READY task exists while a lower-priority task is focused and the protected window has expired, regardless of staleness score (visibility-only, not a block).

### Definition of Done

- [ ] ADR-020 committed before any implementation file is modified.
- [ ] `arch govern` with a stale P2 task (score > threshold, window expired) and a P1 candidate correctly soft-preempts.
- [ ] `arch govern` with a P0 READY task hard-preempts regardless of protected window or staleness score.
- [ ] `arch govern` within the protected window preserves focus even when candidate outranks and score is above threshold.
- [ ] `arch exec --progress "reason"` reduces staleness score by 1 and is logged with `certified_by: operator`.
- [ ] `.arch/focus-ledger.jsonl` contains a complete, auditable trail for all focus changes and score mutations.
- [ ] Unit tests cover all three layers, the staleness score table, the H3a +3 path, and the operator assertion path.
- [ ] `arch review FocusSovereignty` warns on the current state (P1 TASK-245 and TASK-247 unblocked while P2 focused) — validates the check fires on real data.

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
