## TASK-184: Add Census (context budget) check to arch review
**Meta:** P2 | M | IN_PROGRESS | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/domain/services/drift-checker.ts, arch.config.json
**Depends:** none
**ADR:** ADR-007

### Context
ADR-002 establishes context-as-budget as a core principle but there is no enforcement mechanism. Directories can silently exceed LLM context capacity with no warning until it causes a failure.

### Acceptance Criteria
- [ ] `arch.config.json` supports a `contextBudget` block mapping directory paths to line-count thresholds
- [ ] New `Census` drift check in `DriftChecker` counts lines per configured directory
- [ ] WARN emitted when a threshold is exceeded, with a suggested PURGE or REFACTOR action in the message
- [ ] `Census` check appears in `arch review` drift output
- [ ] Default thresholds documented as example in `arch.config.json` schema

### Definition of Done
- [ ] `arch review` passes
- [ ] `npm test` passes in `cli/`
