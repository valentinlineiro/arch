## TASK-177: Expand testing-a-change.md into a per-change-type matrix
**Meta:** P2 | XS | IN_PROGRESS | Focus:no | 6-writing | local | docs/guidelines/testing-a-change.md
**Depends:** none

### Context
`testing-a-change.md` covers only changes to `docs/agents/` (4 lines). There is no guidance for CLI changes, config changes, or guideline changes — the majority of change types.

### Acceptance Criteria
- [x] `testing-a-change.md` covers CLI changes: `npm run build && npm test` + `arch review`
- [x] `testing-a-change.md` covers agent protocol changes (`docs/agents/`): existing rule preserved
- [x] `testing-a-change.md` covers guideline changes: `arch review` + verify no active references broken
- [x] `testing-a-change.md` covers config changes: `arch review` + confirm changed field is exercised

### Definition of Done
- [x] `arch review` passes
