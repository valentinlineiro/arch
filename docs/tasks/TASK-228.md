## TASK-228: Wire causal signal generation into arch task done and arch govern
**Meta:** P1 | S | READY | Focus:yes | 2-code-generation | claude-code | cli/src/main/ts/application/use-cases/mark-task-done.ts, cli/src/main/ts/application/use-cases/govern-system.ts
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
- [ ] On successful task close, `MarkTaskDone` appends an `ontological/reinforce` signal: `from: TASK-XXX, relation: fixes, confidence: heuristic, source: lifecycle` → prose: verified by checking `.arch/causal-signal.jsonl` after `arch task done TASK-XXX`
- [ ] `GovernSystem` accepts an optional `CausalSignalLog` parameter
- [ ] On a protected-path violation, `GovernSystem` appends a `normative/create` signal: `from: <violating-file>, relation: violated, to: <guideline-or-ADR>, confidence: heuristic, source: lifecycle` → prose: verified by triggering a govern violation and checking signal log
- [ ] `index.ts` wires `CausalSignalLog` into both `MarkTaskDone` and `GovernSystem`
- [ ] `arch causal arbitrate` processes the generated signals without error → cmd: arch causal arbitrate; exit: 0
- [ ] Query Isolation Invariant holds: generated signals do not affect `arch ask` scoring until arbitrated → prose: verified by checking ask output before and after arbitrate
- [ ] `npm test --prefix cli` passes → cmd: npm test --prefix cli; exit: 0
- [ ] `arch review` passes → cmd: arch review; exit: 0

## Hansei
<!-- to be filled on close -->
