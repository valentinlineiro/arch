## TASK-921: AC predicate suggestions in arch task create: class-appropriate scaffolding
**Meta:** P1 | S | REVIEW | Focus:no | 1-code-reasoning | claude-code | cli/src/main/ts/application/use-cases/create-task.ts, docs/templates/

**Depends:** TASK-917

### Context

`arch task create <intent>` generates a task shell but ACs are freeform. A `1-code-reasoning` task should get `prose:` ACs. A `2-code-generation` task should get `cmd:` predicates. The DoR validator catches missing ACs at `arch task start` but doesn't help generate them. The gap: a class-aware AC template that suggests the right predicate structure at creation time.

### Acceptance Criteria

- [x] `docs/templates/` updated: each class template (`task-1-code-reasoning.md`, `task-2-code-generation.md`, `task-6-writing.md`, `task-7-operations.md`) has 2–3 example ACs using the appropriate predicate type for that class. Templates are used by both `arch task new --class` and `arch task create`.
  - `file: docs/templates/`

- [x] `arch task create <intent>` output includes a `### Acceptance Criteria` section with 2–3 candidate ACs using class-appropriate predicates, derived from the intent string. If THINK is unavailable (no API key, no TTY), falls back to the class template defaults.
  - `prose: verified by running arch task create "add JWT auth" --class 2-code-generation`

- [x] DoR improvement: when `arch task start` fails DoR validation, error message includes one-line remediation hint per violation (e.g. "Missing Size: add XS/S/M/L to meta line field 2").
  - `file: cli/src/main/ts/application/use-cases/mark-task-in-progress.ts`

- [x] `arch review` passes.
  - `cmd: node cli/dist/index.js review`

- [x] `npm test` passes.
  - `cmd: npm test`

### Definition of Done
- [x] All ACs checked by Auditor
- [x] `arch review` passes
- [x] `npm test` passes in `cli/`

## Hansei
**Severity:** H0
**Category:** [AuditGap]
**Decision:** All 4 class templates updated with 3 example ACs using correct predicate types. CreateTask.scaffold() rewritten: class-aware predicate suggestion for LLM-generated ACs, skeleton ACs for fallback. DoR error messages now include remediation hints per violation. One test fix: case-insensitive class check.
**Constraint:** LLM-generated ACs get suggestive predicates (cmd/file/prose) but not actual command strings — the user must fill in the real command.
**Cost:** None — no architectural debt introduced.
**Forward Action:** None required.
