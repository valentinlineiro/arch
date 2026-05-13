## TASK-209: Fix commit message checker to recognize chore: [THINK] as governance tag
**Meta:** P2 | XS | IN_PROGRESS | Focus:yes | 2-code-generation | claude-code | cli/src/main/ts/domain/services/reviewer.ts
**Depends:** none

### Context
`validateCommitMessage` in `reviewer.ts` defines governance exemption via `message.startsWith('[THINK]')`, but THINK commits use the `chore: [THINK] ...` format. This causes a persistent false-positive "Commit message must reference a TASK-ID" violation in `arch review` after every THINK session.

Detected by Kaizen in session 2026-05-06. Matches P-003 (quality gates must not produce noise).

### Acceptance Criteria
- [ ] `isGovernance` detection in `reviewer.ts` uses a regex or `includes` check so that `chore: [THINK] ...`, `chore: [KAIZEN] ...`, and `chore: [SELF-PROMOTION] ...` are all recognized as governance commits → code: verified by reading the file
- [ ] Unit test: `chore: [THINK] Phase 1 — foo` passes without violations → test: `npm test` passes in `cli/`
- [ ] Unit test: `feat: add something` without TASK-ID still fails → test: regression guard
- [ ] `arch review` passes → cmd: `arch review`
- [ ] `npm test` passes in `cli/` → cmd: `cd cli && npm test`

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
- [ ] `npm test` passes in `cli/`.
