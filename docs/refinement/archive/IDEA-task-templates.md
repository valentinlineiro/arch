# IDEA: Task templates by class — arch task new --class
**Created:** 2026-05-17
**Source:** Session observation — every task is freeform, AC structure varies by author not by class
**Status:** PROMOTED
**Sessions:** 0
**Meta:** P2 | S | 6-writing | cli/src/main/ts/application/commands/task-command.ts, docs/templates/

## Problem

Every task is freeform. A `1-code-reasoning` task (architecture, ADRs) should have a `### Gaps` section, prose ACs, and `prose:` predicates. A `7-operations` task (ETL, config) should have `cmd:` predicates with exit codes. A `6-writing` task should have `file:` predicates. Today this knowledge lives in TASK-FORMAT.md and human memory — it's not enforced at creation time.

The result: tasks reach READY with wrong predicate types, missing sections, or AC structures that will fail TaskTemplateCompliance linter checks. The Definition of Ready validation catches some of this at `arch task start`, but not the structural gaps.

## Proposed Solution

`arch task new --class 1-code-reasoning --size M "Implement JWT auth middleware"` — scaffolds a new task file with:

- Correct meta line skeleton
- Pre-populated `### Gaps` section (for M+)
- AC template with appropriate predicate types for the class:
  - `1-code-reasoning`: `prose:` + `code:` predicates, architectural decision record template
  - `2-code-generation`: `cmd:` predicates (test runner, file existence)
  - `6-writing`: `file:` predicates
  - `7-operations`: `cmd:` predicates (script exit codes)
- Empty `## Hansei` with correct field structure
- Auto-incremented TASK-ID

File written to `docs/tasks/TASK-XXX.md`, opened in `$EDITOR` if set.

**Template source:** `docs/templates/task-<class>.md` — human-editable, not hardcoded.

## Constraint Axes
- Dependency ordering: None
- Temporal validity: Valid now
- Abstraction layer: Correct — scaffolding, no governance
- Observability validity: Deterministic
- Priority displacement: P2

## Decision
PROMOTE → TASK-914
