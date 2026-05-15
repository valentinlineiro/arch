## TASK-269: Grandfather legacy tasks in arch review HanseiPresent check
**Meta:** P2 | XS | READY | Focus:no | 2-code-generation | claude | cli/src/main/ts/application/use-cases/drift-checker.ts

### Context

The `HanseiPresent` check in `arch review` flags every legacy task (TASK-001 through TASK-188) archived before the Hansei protocol was mandatory, producing over 100 WARN lines that obscure real violations. DriftChecker must be updated to only enforce `HanseiPresent` for tasks with ID > 188 (or a configurable threshold).

### Acceptance Criteria

- [ ] `DriftChecker.ts` only enforces `HanseiPresent` for tasks with ID > 188 (or a configurable `hanseiMandatoryFrom` threshold).
- [ ] `arch review` no longer emits HanseiPresent warnings for TASK-001 through TASK-188.
- [ ] `arch review` passes.  →  cmd: bash scripts/arch.sh review; exit: 0

### Definition of Done

- [ ] Legacy task grandfathering implemented in DriftChecker with ID-based threshold.
- [ ] `arch review` passes.
