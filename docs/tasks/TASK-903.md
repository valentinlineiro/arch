## TASK-903: Focus-Status alignment drift check in arch review
**Meta:** P1 | XS | READY | Focus:no | 7-operations | claude-code | cli/src/main/ts/application/use-cases/drift-checker.ts

**Depends:** none

### Context

Observed drift: a task can be `IN_PROGRESS` with `Focus:no`, or `READY`/`BLOCKED` with `Focus:yes`. Both violate the lifecycle invariants in `AGENTS.md`. `arch govern` is the only authority to set `Focus:yes` but manual edits and edge cases in the governing ledger can introduce inconsistent state. Currently undetected by `arch review`.

### Acceptance Criteria

- [ ] `DriftChecker.checkFocusStatusAlignment()` added: scans all tasks in `docs/tasks/`. Emits WARN for:
  - Any task with Status `IN_PROGRESS` and `Focus:no`
  - Any task with Status `READY` or `BLOCKED` and `Focus:yes`
  Status `REVIEW` with `Focus:yes` is permitted — task may retain focus while awaiting Auditor.
  - `cmd: node cli/dist/index.js review`

- [ ] `checkFocusStatusAlignment` registered in `DriftChecker.check()`.
  - `file: cli/src/main/ts/application/use-cases/drift-checker.ts`

- [ ] Unit test: IN_PROGRESS + Focus:no → WARN. READY + Focus:yes → WARN. REVIEW + Focus:yes → OK.
  - `cmd: npm test`

- [ ] `arch review` passes.
  - `cmd: node cli/dist/index.js review`

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
