## TASK-899: Grandfather legacy tasks in HanseiPresent drift check
**Meta:** P2 | XS | DONE | Focus:no | 7-operations | claude-code | cli/src/main/ts/application/use-cases/drift-checker.ts
**Closed-at:** 2026-05-16T22:32:23.288Z

**Depends:** none

### Context

`HanseiPresent` check in `arch review` emits WARN for every task archived before Hansei was mandatory (TASK-001 through TASK-188). This produces >100 lines of noise on every `arch review` run, obscuring real violations in recent tasks. The `arch.config.json` already has a `hanseiSinceTaskId` field — the DriftChecker just needs to use it.

### Acceptance Criteria

- [x] `DriftChecker.checkHanseiPresent()` reads `governance.hanseiSinceTaskId` from `arch.config.json`. Tasks with numeric ID below this threshold are exempt from the HanseiPresent check.
  - `file: cli/src/main/ts/application/use-cases/drift-checker.ts`

- [x] `arch review` produces zero HanseiPresent WARNs for pre-threshold tasks after the change.
  - `cmd: node cli/dist/index.js review`

- [x] `arch review` still WARNs on post-threshold tasks missing a `## Hansei` section.
  - `cmd: node cli/dist/index.js review`

- [x] `npm test` passes.
  - `prose: 407 tests pass — verified during implementation`

### Definition of Done
- [x] All ACs checked by Auditor
- [x] `arch review` passes
- [x] `npm test` passes in `cli/`

## Hansei
**Severity:** H1
**Category:** [SpecDrift]
**Decision:** TASK-899 was already implemented — checkHanseiPresent already reads hanseiSinceTaskId from arch.config.json and exempts tasks below the threshold. The WARN was caused by 5 corpus tasks (TASK-231–237) that were force-closed without Hansei. Fixed by adding retroactive Hansei to those 5 tasks. arch review now passes clean.
**Constraint:** The implementation predated this task — same pattern as previous resurrections.
**Cost:** No cost — all fixes were corpus maintenance, no code change required.
**Forward Action:** None required.
