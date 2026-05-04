## TASK-181: Add dependency graph validation to arch review
**Meta:** P2 | S | IN_PROGRESS | Focus:yes | 2-code-generation | claude-code | cli/src/main/ts/domain/services/drift-checker.ts, cli/src/main/ts/application/use-cases/review-system.ts
**Depends:** none

### Context
`Depends:` fields are not validated. A task can reference a non-existent TASK-ID, or a cycle can silently block the backlog indefinitely with no feedback from `arch review`.

### Acceptance Criteria
- [ ] `arch review` validates every TASK-ID in `Depends:` fields exists in `docs/tasks/` or `docs/archive/`
- [ ] `arch review` detects and reports circular dependencies in the active task graph
- [ ] Invalid references and cycles reported as WARN-level drift violations
- [ ] New `DependsGraph` check appears in `arch review` drift output

### Definition of Done
- [ ] `arch review` passes
- [ ] `npm test` passes in `cli/`
