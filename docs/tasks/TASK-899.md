## TASK-899: Grandfather legacy tasks in HanseiPresent drift check
**Meta:** P2 | XS | READY | Focus:no | 7-operations | claude-code | cli/src/main/ts/application/use-cases/drift-checker.ts

**Depends:** none

### Context

`HanseiPresent` check in `arch review` emits WARN for every task archived before Hansei was mandatory (TASK-001 through TASK-188). This produces >100 lines of noise on every `arch review` run, obscuring real violations in recent tasks. The `arch.config.json` already has a `hanseiSinceTaskId` field — the DriftChecker just needs to use it.

### Acceptance Criteria

- [ ] `DriftChecker.checkHanseiPresent()` reads `governance.hanseiSinceTaskId` from `arch.config.json`. Tasks with numeric ID below this threshold are exempt from the HanseiPresent check.
  - `file: cli/src/main/ts/application/use-cases/drift-checker.ts`

- [ ] `arch review` produces zero HanseiPresent WARNs for pre-threshold tasks after the change.
  - `cmd: node cli/dist/index.js review`

- [ ] `arch review` still WARNs on post-threshold tasks missing a `## Hansei` section.
  - `cmd: node cli/dist/index.js review`

- [ ] `npm test` passes.
  - `cmd: npm test`

### Definition of Done
- [ ] All ACs checked by Auditor
- [ ] `arch review` passes
- [ ] `npm test` passes in `cli/`

## Hansei
**Severity:** H0
**Category:** [no-issue]
**Decision:** Not yet started.
**Constraint:** None.
**Cost:** None.
**Forward Action:** None.
