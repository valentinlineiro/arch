## TASK-914: arch task new --class: task scaffolding by class
**Meta:** P2 | S | IN_PROGRESS | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/application/commands/task-command.ts, docs/templates/

**Depends:** none

### Context

Tasks are created freeform. A `1-code-reasoning` task should have prose ACs and a `### Gaps` section. A `7-operations` task should have `cmd:` predicates. This knowledge lives in TASK-FORMAT.md and human memory : the wrong predicate type is the most common AC compliance failure caught by TaskTemplateCompliance.

### Acceptance Criteria

- [x] `arch task new --class <class> --size <size> "Task title"` creates `docs/tasks/TASK-XXX.md` with:
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

- [x] Template source: `docs/templates/task-<class>.md` files (human-editable). If template file absent for a class, falls back to generic template. Templates created at `docs/templates/` for the 4 main classes.
  - `file: docs/templates/`

- [x] `arch task new` with no args prints usage showing valid classes and sizes.
  - `cmd: node cli/dist/index.js task new`

- [x] `M` and `L` sizes automatically include `### Gaps` section regardless of class.
  - `prose: verified by inspecting generated task file`

- [x] `arch review` passes after task creation.
  - `cmd: node cli/dist/index.js review`

- [x] `npm test` passes.
  - `prose: verified during implementation`

### Definition of Done
- [x] All ACs checked by Auditor
- [x] `arch review` passes
- [x] `npm test` passes in `cli/`

## Hansei
**Severity:** H1
**Category:** [SpecDrift]
**Decision:** arch task new --class works. Templates in docs/templates/ loaded by class prefix. Two bugs fixed: readDirectory needs rootPath prefix; fmt.success does not exist (replaced with fmt.check).
**Constraint:** Template resolution uses class prefix only (e.g. "2" for "2-code-generation"). Full class name match checked first.
**Cost:** None — bugs were in new code, not existing paths.
**Forward Action:** None required.
