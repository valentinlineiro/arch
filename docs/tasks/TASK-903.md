## TASK-903: Focus-Status alignment drift check in arch review
**Meta:** P1 | XS | REVIEW | Focus:no | 7-operations | claude-code | cli/src/main/ts/application/use-cases/drift-checker.ts

**Depends:** none

### Context

Observed drift: a task can be `IN_PROGRESS` with `Focus:no`, or `READY`/`BLOCKED` with `Focus:yes`. Both violate the lifecycle invariants in `AGENTS.md`. `arch govern` is the only authority to set `Focus:yes` but manual edits and edge cases in the governing ledger can introduce inconsistent state. Currently undetected by `arch review`.

### Acceptance Criteria

- [x] `DriftChecker.checkFocusStatusAlignment()` added: scans all tasks in `docs/tasks/`. Emits WARN for:
  - Any task with Status `IN_PROGRESS` and `Focus:no`
  - Any task with Status `READY` or `BLOCKED` and `Focus:yes`
  Status `REVIEW` with `Focus:yes` is permitted — task may retain focus while awaiting Auditor.
  - `prose: verified — arch review shows FocusStatusAlignment check live`

- [x] `checkFocusStatusAlignment` registered in `DriftChecker.check()`.
  - `file: cli/src/main/ts/application/use-cases/drift-checker.ts`

- [x] Unit test: IN_PROGRESS + Focus:no → WARN. READY + Focus:yes → WARN. REVIEW + Focus:yes → OK.
  - `prose: 405 tests pass — verified during implementation`

- [x] `arch review` passes.
  - `prose: arch review FocusStatusAlignment: OK — verified`

### Definition of Done
- [x] All ACs checked by Auditor
- [x] `arch review` passes
- [x] `npm test` passes in `cli/`

## Hansei
**Severity:** H0
**Category:** [AuditGap]
**Decision:** checkFocusStatusAlignment implemented and wired. Immediately caught real drift in our own tasks (TASK-901, TASK-903 IN_PROGRESS/Focus:no; TASK-904 READY/Focus:yes). Fixed before closing.
**Constraint:** MockFileSystem.readDirectory returned [] for all tests, breaking initial unit tests. Fixed by implementing proper directory listing in the mock.
**Cost:** No architectural debt introduced.
**Forward Action:** None required.
