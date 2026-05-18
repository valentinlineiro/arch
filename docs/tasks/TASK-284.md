## TASK-284: Add task template linter to arch review for Definition of Ready validation
**Meta:** P1 | S | READY | Focus:no | 2-code-generation | claude | cli/src/main/ts/

### Context

CORE.md requires tasks to comply with TASK-FORMAT.md before READY status, but this is currently manual. TASK-031 was archived DONE without checked ACs because format was never validated. This task adds a schema check to `arch review` that parses READY/REVIEW tasks and fails if Meta line, Acceptance Criteria, or Definition of Done are missing or malformed.

### Acceptance Criteria

- [ ] `arch review` parses `docs/tasks/*.md` with status READY or REVIEW and validates: Meta line present with valid Size, Acceptance Criteria section present, Definition of Done section present.
- [ ] A violation produces a non-zero exit from `arch review` with a clear error message identifying the malformed task.
- [ ] `arch review` passes.  →  cmd: arch review; exit: 0

### Definition of Done

- [ ] Task template linter implemented in arch review; tested against both valid and invalid task files.
- [ ] `arch review` passes.
