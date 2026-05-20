## TASK-962: Fix arch task done to scope unchecked AC check to Acceptance
**Meta:** P1 | XS | READY | Focus:no | 2-code-generation | local | docs/tasks/
**Actor:** unknown
**Created-at:** 2026-05-19T14:47:05.554Z
**Depends:** none

### Acceptance Criteria
- [ ] Implementation file exists at declared context path
  - `file: (path)`
- [ ] Tests pass
  - `cmd: npm test; exit: 0`
- [ ] `arch review` passes
  - `cmd: node cli/dist/index.js review`

### Context

### Relevant Context
_confidence: 0.47_

**Files:**
- cli/src/main/ts/domain/models/task.ts _(core)_
- cli/src/main/ts/domain/models/context-index.ts _(core)_
- cli/src/main/ts/domain/task.ts _(core)_
- cli/src/main/ts/application/use-cases/validate-task-acs.ts _(domain)_
- cli/src/main/ts/domain/models/feedback-signal.ts _(core)_

**ADRs:**
- ADR-002: Context as a budget, not a default _(enforced)_
- ADR-006: Depends Graph Validation in DriftChecker Domain Service _(enforced)_
- ADR-007: Census Context Budget Check in DriftChecker _(enforced)_

**Guidelines:**
- testing-a-change.md
- versioning.md

**Failure Patterns:**
- `arch review` does not validate ACs before archiving*(Sprint 3)*: TASK-031 was archived as DONE but with unchecked ACs. The reviewer detected the inconsistency but did not block archival at the time. Detection arrived late (next session). *(Resolved by TASK-078)* _(docs/KAIZEN-LOG.md)_
- Recursive review violation tasks*(Sprint 4)*: TASK-112, 113, and 114 show a pattern where a task is created to fix a review violation, but then marked DONE with its own violations (e.g. pending ACs), leading to a chain of cleanup tasks. **Proposal:** Implement pre-archive guards (TASK-115) and enforce AC validation during `arch review`. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

#### Intent
Fix arch task done to scope unchecked AC check to Acceptance Criteria and Definition of Done sections only, ignoring Context Feedback checkboxes. Mirrors ValidateTaskAcs section-scoping logic. One-function change extracting section-scoped content before checking for unchecked items.

### Definition of Done
- [ ] All ACs checked by Auditor
- [ ] `arch review` passes