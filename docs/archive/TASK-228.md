## TASK-228: Wire causal signal generation into arch task done and arch govern
**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/application/use-cases/mark-task-done.ts, cli/src/main/ts/application/use-cases/govern-system.ts
**Closed-at:** 2026-05-12T08:06:31.589Z
**Depends:** none
**ADR:** ADR-015

## Context

ADR-015 defines the backward loop: lifecycle events → signal layer → arbitration → graph mutation. The signal layer (`CausalSignalLog`) is implemented and `arch causal arbitrate` works. The gap is that no lifecycle event currently generates signals automatically.

TASK-226 wired `arch loop` → `MarkTaskDone` with a `FeedbackRepository`. The same path needs `CausalSignalLog`. Separately, `GovernSystem` detects violations (protected-path changes, stale tasks, repeated review failures) but never writes normative signals — so arbitration has nothing to consume.

Two specific hooks per ADR-015:
- `task done` → `ontological/reinforce` signal on the completing task (task closure is evidence the task was correctly scoped and executed)
- `govern` violation → `normative/create` signal linking the violation entity to the violated guideline (surfaces recurring governance failures for human review)

## Acceptance Criteria

- [x] `MarkTaskDone` accepts an optional `CausalSignalLog` parameter
- [x] On successful task close, `MarkTaskDone` appends ontological signals: `implements` per `**ADR:**` field, `caused_by` per `**Depends:**` field → prose: verified — TASK-228 close wrote `TASK-228 implements ADR-015` to causal-signal.jsonl
- [x] `GovernSystem` accepts an optional `CausalSignalLog` parameter
- [x] On archival violation, `GovernSystem` appends a `normative/create` signal: `from: taskId, relation: violated, to: docs/HALT.md` → code: verified by reading govern-system.ts archiveFile error handler
- [x] `index.ts` wires `CausalSignalLog` into both `MarkTaskDone` and `GovernSystem`
- [x] `arch causal arbitrate` processes the generated signals without error → cmd: arch causal arbitrate; exit: 0
- [x] Query Isolation Invariant holds: generated signals do not affect `arch ask` scoring until arbitrated → prose: `causal show ADR-015` returns no active relations while signal is pending
- [x] `npm test --prefix cli` passes → cmd: npm test --prefix cli; exit: 0
- [x] `arch review` passes → cmd: arch review; exit: 0

## Hansei
The AC said `ontological/reinforce` but the signal model requires `reinforce` to target an existing edge. Implemented as `create` instead — semantically correct (signals are hypotheses, not facts), and the arbitrator handles both. The govern violation signal was scoped to archival failures (the only concrete violation govern detects today); protected-path violations remain in the drift checker, not govern. That boundary is a follow-up decision.
