## TASK-990: Fix meta line regex - add Turns capture group, document Locked-commit and auxiliary fields
**Meta:** P2 | S | READY | Focus:no | 6-writing | local | docs/tasks/
**Depends:** none

### Acceptance Criteria
- [ ] Add `( \| Turns: (?<turns>\d+))?` capture group to Meta line regex in task-validator.ts
  - `grep: "turns" cli/src/main/ts/domain/services/task-validator.ts`
- [ ] Add `## Auxiliary Fields` section to TASK-FORMAT.md documenting Locked-commit, Created-at, Actor
  - `grep: "Auxiliary Fields" docs/TASK-FORMAT.md`
- [ ] Locked-commit documented as persisted below Meta line (not in it), per AGENTS.md Invariants
  - `grep: "Locked-commit" docs/TASK-FORMAT.md`
- [ ] TASK-FORMAT.md example shows Turns inside Meta line (e.g., `| Turns: 12`)
  - `grep: "Turns: " docs/TASK-FORMAT.md`

### Context

### Relevant Context
_confidence: 0.55_

**Files:**
- cli/src/main/ts/domain/services/task-validator.ts _(core)_
- docs/TASK-FORMAT.md _(core)_
- docs/AGENTS.md _(advisory)_

**ADRs:**

**Guidelines:**

**Failure Patterns:**

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

#### Intent
Fix two Meta line specification defects: Turns field missing from regex, and Locked-commit (plus Created-at, Actor) undocumented in TASK-FORMAT.md.

### Definition of Done
- [ ] All ACs checked by Auditor
- [ ] `arch review` passes

## Hansei
**Severity:** H0
**Category:** [SpecDrift]
**Decision:** Not yet started.
**Constraint:** No constraints apply — task has not started.
**Cost:** No cost incurred — task has not started.
**Forward Action:** None.
