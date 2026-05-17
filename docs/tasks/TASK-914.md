## TASK-914: arch task new --class: task scaffolding by class
**Meta:** P2 | S | READY | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/application/commands/task-command.ts, docs/templates/

**Depends:** none

### Context

Tasks are created freeform. A `1-code-reasoning` task should have prose ACs and a `### Gaps` section. A `7-operations` task should have `cmd:` predicates. This knowledge lives in TASK-FORMAT.md and human memory : the wrong predicate type is the most common AC compliance failure caught by TaskTemplateCompliance.

### Acceptance Criteria

- [ ] `arch task new --class <class> --size <size> "Task title"` creates `docs/tasks/TASK-XXX.md` with:
  - Auto-incremented ID (next available after scanning docs/tasks/ and docs/archive/)
  - Correct meta line skeleton
  - Class-appropriate AC template:
    - `1-code-reasoning`: `prose:` and `code:` predicate stubs, `### Gaps` section
    - `2-code-generation`: `cmd:` predicate stubs with exit-code format
    - `6-writing`: `file:` predicate stubs
    - `7-operations`: `cmd:` predicate stubs
    - All others: generic `prose:` stubs
  - Empty `## Hansei` block with all 6 required fields
  - `file: cli/src/main/ts/application/commands/task-command.ts`

- [ ] Template source: `docs/templates/task-<class>.md` files (human-editable). If template file absent for a class, falls back to generic template. Templates created at `docs/templates/` for the 4 main classes.
  - `file: docs/templates/`

- [ ] `arch task new` with no args prints usage showing valid classes and sizes.
  - `cmd: node cli/dist/index.js task new`

- [ ] `M` and `L` sizes automatically include `### Gaps` section regardless of class.
  - `prose: verified by inspecting generated task file`

- [ ] `arch review` passes after task creation.
  - `cmd: node cli/dist/index.js review`

- [ ] `npm test` passes.
  - `prose: verified during implementation`

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
