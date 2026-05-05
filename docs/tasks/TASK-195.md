## TASK-195: Hansei drift check - mandate and verify Hansei section on archived tasks
**Meta:** P1 | XS | READY | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/domain/services/drift-checker.ts, docs/TASK-FORMAT.md
**Depends:** none

### Context
`## Hansei` is required by DO.md on task close but is convention-only. Tasks are being archived without reflection, and `arch review` cannot detect the omission. This check closes that gap with minimal effort — the pattern is identical to existing DriftChecker scans.

### Acceptance Criteria
- [ ] `docs/TASK-FORMAT.md` marks `## Hansei` as a required section on DONE tasks
- [ ] A `HanseiPresent` drift check in `DriftChecker` scans `docs/archive/*.md` and flags any task missing a `## Hansei` section as a named violation in `arch review`
- [ ] `arch review` passes
- [ ] `npm test` passes in `cli/`

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
- [ ] `npm test` passes in `cli/`.
