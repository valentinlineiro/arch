## TASK-907: Task template linter: validate TASK-FORMAT schema in arch review
**Meta:** P1 | S | READY | Focus:no | 7-operations | claude-code | cli/src/main/ts/application/use-cases/drift-checker.ts, docs/TASK-FORMAT.md

**Depends:** none

### Context

`CORE.md` states tasks must comply with `TASK-FORMAT.md` before READY. Today this is manual — tasks reach READY and even DONE with malformed meta lines (empty Size, missing Class, no ACs). `TASK-203` added Definition of Ready validation at `arch task start`, but does not catch tasks that were manually promoted to READY or already existed before DoR was enforced. `arch review` needs a complementary structural check.

### Acceptance Criteria

- [ ] `DriftChecker.checkTaskTemplateCompliance()` added: scans all tasks in `docs/tasks/` with Status `READY` or `REVIEW`. For each, validates:
  - Meta line has all 7 fields (Priority, Size, Status, Focus, Class, CLI, Context — may be `none`)
  - Priority is one of `P0/P1/P2/P3`
  - Size is one of `XS/S/M/L`
  - Class is non-empty
  - At least one `- [ ]` or `- [x]` AC exists
  - `## Hansei` section present for tasks with numeric ID ≥ `hanseiSinceTaskId`
  Emits WARN per violation.
  - `cmd: node cli/dist/index.js review`

- [ ] `checkTaskTemplateCompliance` registered in `DriftChecker.check()`.
  - `file: cli/src/main/ts/application/use-cases/drift-checker.ts`

- [ ] `docs/TASK-FORMAT.md` updated with a machine-readable schema summary (valid values per field) that the linter references as its source of truth.
  - `file: docs/TASK-FORMAT.md`

- [ ] Unit tests: valid task → OK. Missing Size → WARN. Invalid Priority → WARN. No ACs → WARN.
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
