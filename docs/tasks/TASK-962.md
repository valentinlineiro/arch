## TASK-962: Fix arch task done to scope unchecked AC check to Acceptance
**Meta:** P1 | XS | REVIEW | Focus:no | 2-code-generation | local | docs/tasks/
**Locked-commit:** b48d0bac
**Actor:** unknown
**Created-at:** 2026-05-19T14:47:05.554Z
**Depends:** none

### Acceptance Criteria
- [x] `hasUncheckedACs()` exported from task-command.ts, scopes check to AC/DoD sections only  →  file: cli/src/main/ts/application/commands/task-command.ts
- [x] Context Feedback unchecked items do not block `arch task done` (3 unit tests)  →  cmd: npm --prefix cli test; exit: 0
- [x] `arch review` passes  →  cmd: arch review; exit: 0

### Context


### Relevant Context
_confidence: 0.46_

**Files:**
- .arch/focus-ledger.jsonl _(utility)_
- cli/src/main/ts/domain/models/context-index.ts _(core)_
- cli/src/main/ts/domain/models/task.ts _(core)_
- .arch/chronicle.jsonl _(utility)_
- docs/EVENTS.md _(utility)_

**ADRs:**
- ADR-006: Depends Graph Validation in DriftChecker Domain Service _(enforced)_
- ADR-002: Context as a budget, not a default _(enforced)_
- ADR-007: Census Context Budget Check in DriftChecker _(enforced)_

**Guidelines:**
- testing-a-change.md
- versioning.md

**Failure Patterns:**
- Recursive review violation tasks*(Sprint 4)*: TASK-112, 113, and 114 show a pattern where a task is created to fix a review violation, but then marked DONE with its own violations (e.g. pending ACs), leading to a chain of cleanup tasks. **Proposal:** Implement pre-archive guards (TASK-115) and enforce AC validation during `arch review`. _(docs/KAIZEN-LOG.md)_
- `arch review` does not validate ACs before archiving*(Sprint 3)*: TASK-031 was archived as DONE but with unchecked ACs. The reviewer detected the inconsistency but did not block archival at the time. Detection arrived late (next session). *(Resolved by TASK-078)* _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

#### Intent
Fix arch task done to scope unchecked AC check to Acceptance Criteria and Definition of Done sections only, ignoring Context Feedback checkboxes. Mirrors ValidateTaskAcs section-scoping logic. One-function change extracting section-scoped content before checking for unchecked items.

### Definition of Done
- [x] All ACs checked by Auditor  →  prose: verified
- [x] `arch review` passes  →  cmd: arch review; exit: 0

## Hansei
**Severity:** H0
**Category:** [ReviewBlindspot]
**Decision:** Implementation was a one-function extraction mirroring the existing ValidateTaskAcs.extractACSections pattern. Initial TDD attempt used stdout capture to detect the bug signal, but fmt.fail writes to console.log (stdout) which interfered with the test runner's own output stream. Switched to testing the extracted helper function directly — cleaner isolation with no side effects.
**Constraint:** The stdout-capture approach is unreliable in node:test because the runner writes results to the same stream during test execution.
**Cost:** One iteration to correct the test approach before GREEN.
**Forward Action:** None required.