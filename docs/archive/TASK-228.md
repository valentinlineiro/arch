## TASK-228: Wire causal signal generation into arch task done and arch govern
**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/application/use-cases/mark-task-done.ts, cli/src/main/ts/application/use-cases/govern-system.ts
**Closed-at:** 2026-05-12T08:06:31.589Z
**Depends:** none

## Hansei
The AC said `ontological/reinforce` but the signal model requires `reinforce` to target an existing edge. Implemented as `create` instead — semantically correct (signals are hypotheses, not facts), and the arbitrator handles both. The govern violation signal was scoped to archival failures (the only concrete violation govern detects today); protected-path violations remain in the drift checker, not govern. That boundary is a follow-up decision.
