## TASK-195: Hansei drift check - mandate and verify Hansei section on archived tasks
**Meta:** P1 | XS | DONE | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/domain/services/drift-checker.ts, docs/TASK-FORMAT.md
**Closed-at:** 2026-05-05T11:00:00.000Z
**Depends:** none

### Context
`## Hansei` is required by DO.md on task close but is convention-only. Tasks are being archived without reflection, and `arch review` cannot detect the omission. This check closes that gap with minimal effort — the pattern is identical to existing DriftChecker scans.

### Acceptance Criteria
- [x] `docs/TASK-FORMAT.md` marks `## Hansei` as a required section on DONE tasks
- [x] A `HanseiPresent` drift check in `DriftChecker` scans `docs/archive/*.md` and flags any task missing a `## Hansei` section as a named violation in `arch review` (following the machine-enforced drift pattern in ADR-007)
- [x] `arch review` passes
- [x] `npm test` passes in `cli/`

### Definition of Done
- [x] All ACs checked.
- [x] `arch review` passes.
- [x] `npm test` passes in `cli/`.

## Hansei
The first pass enforced Hansei against the full archive and only passed in source tests; the rollout boundary needed to be encoded in the built CLI too.
