## TASK-890: arch task start - Contextual Memory Injection
**Meta:** P1 | M | READY | Focus:no | 2-code-generation | local | cli/src/main/ts/
**Depends:** none

### Acceptance Criteria
- [ ] ContextInference extended to retrieve Hansei failures from archive/ based on class match and context overlap → prose: verified by inspecting edit-task-metadata output for Hansei block
- [ ] TaskCommand.execute('start') captures and prints the inferred Load-bearing Memory block → grep: "LOAD-BEARING" cli/src/main/ts/application/commands/task-command.ts
- [ ] Stdout block includes enforced ADRs (ID, title, core constraint) → prose: verified by running arch task start on a task with matching ADRs
- [ ] Stdout block includes past Hansei failures (Task ID, Category, Decision, Cost) → prose: verified by running arch task start on a task with archive matches
- [ ] Output block is clearly delimited from standard command output → prose: verified visually — dashed separator lines present
- [ ] Agents picking up a task are conditioned by the printed context → prose: observational — context block appears above implementation prompt
- [ ] arch review passes → cmd: node cli/dist/index.js review; exit: 0
- [ ] npm test passes → cmd: npm test --prefix cli; exit: 0

### Context
#### Problem
Agents often start tasks without full knowledge of relevant ADRs or past failures (Hansei) in the same domain. This leads to rework and repeating historical mistakes.

#### Solution
Enhance `arch task start TASK-XXX` to inject "Load-bearing Memory" into stdout.

**Mechanism:**
1. **ADRs:** Match the task's `class` and `context` paths against the ContextIndex to find enforced ADRs.
2. **Hansei Failures:** Identify archived tasks with the same `class` and overlapping `context` paths. Filter for H1-H3 severity Hansei.
3. **Injection (Stdout):** Print a structured block after the "marking as IN_PROGRESS" message.

### Definition of Done
- [ ] All ACs checked → prose: all ACs above verified
- [ ] arch review passes → cmd: node cli/dist/index.js review; exit: 0

## Hansei
**Severity:** H0
**Category:** [SpecDrift]
**Decision:** Pre-implementation assessment. The primary risk is that Hansei retrieval from the archive degrades start-command latency if the archive is large. Scoped to class-match only to keep retrieval O(n) and bounded.
**Constraint:** Injection must not block task start on archive read failure — errors must be swallowed silently so the start command remains safe.
**Cost:** No retrospective cost yet. Update at REVIEW with actual findings.
**Forward Action:** Verify latency is acceptable on the full archive at REVIEW. If degradation exceeds 500ms, introduce a cached index.
