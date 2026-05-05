## TASK-181: Add dependency graph validation to arch review
**Meta:** P2 | S | DONE | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/domain/services/drift-checker.ts, cli/src/main/ts/application/use-cases/review-system.ts
**Closed-at:** 2026-05-05T09:14:29.341Z
**Depends:** none
**ADR:** ADR-006

### Context
`Depends:` fields are not validated. A task can reference a non-existent TASK-ID, or a cycle can silently block the backlog indefinitely with no feedback from `arch review`. Domain change covered by ADR-006.

### Acceptance Criteria
- [x] `arch review` validates every TASK-ID in `Depends:` fields exists in `docs/tasks/` or `docs/archive/`
- [x] `arch review` detects and reports circular dependencies in the active task graph
- [x] Invalid references and cycles reported as WARN-level drift violations
- [x] New `DependsGraph` check appears in `arch review` drift output (domain change: ADR-006)

### Definition of Done
- [x] `arch review` passes
- [x] `npm test` passes in `cli/`

## Hansei
Task is S-sized but touched 3 files (source, test, dist rebuild). The rebuild step is manual — a pre-commit hook that auto-rebuilds on drift-checker changes would close that gap.
