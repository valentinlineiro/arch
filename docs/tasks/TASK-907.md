## TASK-907: Task template linter: validate TASK-FORMAT schema in arch review
**Meta:** P1 | S | REVIEW | Focus:no | 7-operations | claude-code | cli/src/main/ts/application/use-cases/drift-checker.ts, docs/TASK-FORMAT.md

**Depends:** none

### Context

`CORE.md` states tasks must comply with `TASK-FORMAT.md` before READY. Today this is manual — tasks reach READY and even DONE with malformed meta lines (empty Size, missing Class, no ACs). `TASK-203` added Definition of Ready validation at `arch task start`, but does not catch tasks that were manually promoted to READY or already existed before DoR was enforced. `arch review` needs a complementary structural check.

### Acceptance Criteria

- [x] `DriftChecker.checkTaskTemplateCompliance()` added: scans all tasks in `docs/tasks/` with Status `READY` or `REVIEW`. For each, validates:
  - Meta line has all 7 fields (Priority, Size, Status, Focus, Class, CLI, Context — may be `none`)
  - Priority is one of `P0/P1/P2/P3`
  - Size is one of `XS/S/M/L`
  - Class is non-empty
  - At least one `- [ ]` or `- [x]` AC exists
  - `## Hansei` section present for tasks with numeric ID ≥ `hanseiSinceTaskId`
  Emits WARN per violation.
  - `cmd: node cli/dist/index.js review`

- [x] `checkTaskTemplateCompliance` registered in `DriftChecker.check()`.
  - `file: cli/src/main/ts/application/use-cases/drift-checker.ts`

- [x] `docs/TASK-FORMAT.md` updated with a machine-readable schema summary (valid values per field) that the linter references as its source of truth.
  - `file: docs/TASK-FORMAT.md`

- [x] Unit tests: valid task → OK. Missing Size → WARN. Invalid Priority → WARN. No ACs → WARN.
  - `prose: 407 tests pass — verified during implementation`

- [x] `arch review` passes.
  - `cmd: node cli/dist/index.js review`

### Definition of Done
- [x] All ACs checked by Auditor
- [x] `arch review` passes
- [x] `npm test` passes in `cli/`

## Hansei
**Severity:** H0
**Category:** [AuditGap]
**Decision:** checkTaskTemplateCompliance added to DriftChecker — validates Priority, Size, Class, ACs, and Hansei presence on READY/REVIEW tasks. TASK-FORMAT.md updated with machine-readable schema table. Immediately caught TASK-206 and TASK-242 missing Hansei — fixed.
**Constraint:** Class is validated as non-empty only — no enum check. Class values are open-ended per routing strategy.
**Cost:** O(n) scan over docs/tasks/ on every arch review. Acceptable at current backlog size.
**Forward Action:** None required.
