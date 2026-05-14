## TASK-247: Focus Sovereignty Model - Constitutional Preemption Engine
**Meta:** P1 | M | READY | Focus:no | 7-operations | local | cli/src/main/ts/application/use-cases/govern-system.ts, docs/agents/
**Depends:** none

### Context

`arch govern` currently preserves `Focus:yes` unconditionally once set. A P1 task added after a P2 task is focused will be ignored until the P2 task is archived. This is sticky drift: the system appears to govern but actually just remembers.

The fix is not simply "switch on higher priority". Without a protected execution window and a staleness criterion grounded in causal advancement (not git activity), the system either drifts or oscillates. Both are failure modes.

**Staleness definition:** A focused task is stale when it has N governance ticks without a validated state transition — not without a commit. Commits are not progress. Validated transitions include: status change, dependency resolved, Hansei severity reduction, measurable artifact completed.

**Hasei as adjudication layer:** Cases that are not purely mechanical (H3a persistent execution loop, task that unblocks N downstream) are not handled by the scheduler directly. They surface via Hansei escalation and become preemption-eligible through that path.

### Acceptance Criteria
- [ ] `govern-system.ts` implements a three-layer preemption model:
  - **Layer 1 — Hard Preemption**: P0 tasks, integrity/provenance corruption tasks, constitutional invariant violations always preempt, regardless of execution window or staleness. No exceptions.
  - **Layer 2 — Protected Execution Window**: A task in `IN_PROGRESS` is immune to soft preemption for the first `protectedWindowTicks` governance ticks (default: 2). Configurable via `arch.config.json`.
  - **Layer 3 — Soft Preemption**: Triggers only when candidate strictly outranks focused task AND focused task is stale (no validated state transition in `stalenessThresholdTicks` ticks, default: 5) AND protected window has expired.
- [ ] Staleness is measured by validated state transitions recorded in `.arch/focus-ledger.jsonl`, not by git commit timestamps.
- [ ] `.arch/focus-ledger.jsonl` is an append-only ledger. Each entry records: `taskId`, `event` (focus_assigned | state_transition | focus_preempted | focus_preserved), `reason`, `tick`, `timestamp`.
- [ ] When govern preempts focus, it logs a `focus_preempted` entry with the reason (hard | soft | staleness) and the candidate that triggered it.
- [ ] When govern preserves focus (window or rank), it logs a `focus_preserved` entry with the reason.
- [ ] H3a escalation entries in `.arch/escalations.jsonl` make the focused task preemption-eligible (soft preemption threshold drops to 1 tick).
- [ ] ADR-020 documents the Focus Sovereignty Model: hard/soft/window layers, staleness definition, Hansei adjudication path, and audit trail schema.
- [ ] `arch review` gains a `FocusSovereignty` check: fails if a P1+ READY task exists while a lower-priority task is focused and the protected window has expired.

### Definition of Done
- [ ] `arch govern` with a stale P2 focused task and a P1 candidate correctly preempts after the protected window.
- [ ] `arch govern` with a fresh P1 focused task and a P0 candidate correctly hard-preempts immediately.
- [ ] `arch govern` with a fresh P1 focused task and a P1 candidate correctly preserves during the protected window.
- [ ] `.arch/focus-ledger.jsonl` contains an audit trail for all focus changes in the test scenarios above.
- [ ] Unit tests cover all three layers and the H3a escalation path.
- [ ] `arch review` reports `FocusSovereignty` violation when drift is detectable.

## Hansei
**Severity:** H0
**Category:** [SymbolDiscovery]

**Decision:**
No implementation decisions made yet — task is READY.

**Constraint:**
No implementation taken yet; this entry satisfies the structural requirement for a READY task.

**Cost:**
No cost incurred; task not yet started.

**Forward Action:**
none
