## TASK-921: AC predicate suggestions in arch task create: class-appropriate scaffolding
**Meta:** P1 | S | READY | Focus:no | 1-code-reasoning | claude-code | cli/src/main/ts/application/use-cases/create-task.ts, docs/templates/

**Depends:** TASK-917

### Context

`arch task create <intent>` generates a task shell but ACs are freeform. A `1-code-reasoning` task should get `prose:` ACs. A `2-code-generation` task should get `cmd:` predicates. The DoR validator catches missing ACs at `arch task start` but doesn't help generate them. The gap: a class-aware AC template that suggests the right predicate structure at creation time.

### Acceptance Criteria

- [ ] `docs/templates/` updated: each class template (`task-1-code-reasoning.md`, `task-2-code-generation.md`, `task-6-writing.md`, `task-7-operations.md`) has 2–3 example ACs using the appropriate predicate type for that class. Templates are used by both `arch task new --class` and `arch task create`.
  - `file: docs/templates/`

- [ ] `arch task create <intent>` output includes a `### Acceptance Criteria` section with 2–3 candidate ACs using class-appropriate predicates, derived from the intent string. If THINK is unavailable (no API key, no TTY), falls back to the class template defaults.
  - `prose: verified by running arch task create "add JWT auth" --class 2-code-generation`

- [ ] DoR improvement: when `arch task start` fails DoR validation, error message includes one-line remediation hint per violation (e.g. "Missing Size: add XS/S/M/L to meta line field 2").
  - `file: cli/src/main/ts/application/use-cases/mark-task-in-progress.ts`

- [ ] `arch review` passes.
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
