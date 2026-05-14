## TASK-196: [BUG] arch task done exits zero when Hansei guard blocks DONE transition
**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/application/commands/task-command.ts, cli/src/test/ts/, docs/agents/DO.md
**Closed-at:** 2026-05-05T11:47:37.490Z
**Depends:** none

## Hansei
**Severity:** H1
**Category:** [FailOpenBehavior]

**Decision:**
The original `arch task done` implementation returned exit code 0 when the Hansei guard blocked the DONE transition, silently reporting success to callers and CI pipelines. Fix corrects the exit-code contract to propagate the guard's rejection as a non-zero exit.

**Constraint:**
The exit-code path was not covered by tests at the time the guard was introduced, allowing the silent failure to persist until this task.

**Cost:**
Contained to this fix. No residual debt or architectural change required; guard rejection is now propagated correctly.

**Forward Action:**
No forward action required. Exit-code contract is enforced and covered by integration tests added in this task.
