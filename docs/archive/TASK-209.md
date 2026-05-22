## TASK-209: Fix commit message checker to recognize chore: [THINK] as governance tag
**Meta:** P2 | XS | DONE | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/domain/services/reviewer.ts | Closed-at: 2026-05-13T13:20:00Z
**Depends:** none

### Context
`validateCommitMessage` in `reviewer.ts` defines governance exemption via `message.startsWith('[THINK]')`, but THINK commits use the `chore: [THINK] ...` format. This causes a persistent false-positive "Commit message must reference a TASK-ID" violation in `arch review` after every THINK session.

Detected by Kaizen in session 2026-05-06. Matches P-003 (quality gates must not produce noise).

### Acceptance Criteria
- [x] `isGovernance` detection in `reviewer.ts` uses a regex or `includes` check so that `chore: [THINK] ...`, `chore: [KAIZEN] ...`, and `chore: [SELF-PROMOTION] ...` are all recognized as governance commits → code: verified by reading the file
- [x] Unit test: `chore: [THINK] Phase 1 — foo` passes without violations → test: `npm test` passes in `cli/`
- [x] Unit test: `feat: add something` without TASK-ID still fails → test: regression guard
- [x] `arch review` passes → cmd: `arch review`
- [x] `npm test` passes in `cli/` → cmd: `cd cli && npm test`

### Definition of Done
- [x] All ACs checked.
- [x] `arch review` passes.
- [x] `npm test` passes in `cli/`.

## Approval
Approved-by: Auditor | 2026-05-16

## Hansei
The bug was already partially fixed in a prior session — the `isGovernance` regex was correct but no test covered the `chore: [THINK]` format specifically. A cleaner approach would have been to add these tests at the same time the regex was introduced, not as a retroactive fix.

