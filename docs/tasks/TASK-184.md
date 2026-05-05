## TASK-184: Add Census (context budget) check to arch review
**Meta:** P2 | M | REVIEW | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/domain/services/drift-checker.ts, arch.config.json
**Depends:** none
**ADR:** ADR-007

### Context
ADR-002 establishes context-as-budget as a core principle but there is no enforcement mechanism. Directories can silently exceed LLM context capacity with no warning until it causes a failure.

### Acceptance Criteria
- [x] `arch.config.json` supports a `contextBudget` block mapping directory paths to line-count thresholds
- [x] New `Census` drift check in `DriftChecker` counts lines per configured directory
- [x] WARN emitted when a threshold is exceeded, with a suggested PURGE or REFACTOR action in the message
- [x] `Census` check appears in `arch review` drift output
- [x] Default thresholds documented as example in `arch.config.json` schema

### Definition of Done
- [x] `arch review` passes
- [x] `npm test` passes in `cli/`

## Hansei
The Census check counts only top-level files (subdirectories are silently skipped) — a `docs/refinement/archive/` subtree could grow unbounded without triggering the budget. Counting recursively or adding a separate budget entry per subdirectory would close this gap.
