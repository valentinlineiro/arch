## TASK-964: Implement arch task hansei TASK-XXX interactive wizard: read
**Meta:** P2 | M | READY | Focus:no | 2-code-generation | local | docs/tasks/
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
_confidence: 0.49_

**Files:**
- cli/src/main/ts/domain/models/context-index.ts _(core)_
- cli/src/main/ts/domain/models/task.ts _(core)_
- cli/src/main/ts/domain/task.ts _(core)_
- cli/src/main/ts/domain/services/deterministic-hansei-checker.ts _(core)_
- cli/src/main/ts/application/use-cases/hansei-wizard.ts _(domain)_

**ADRs:**
- ADR-007: Census Context Budget Check in DriftChecker _(enforced)_
- ADR-017: Deterministic Observability & Operational Metrics _(enforced)_
- ADR-023: Deterministic Gate Invariant _(enforced)_

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
Implement arch task hansei TASK-XXX interactive wizard: reads task diff and AC outcomes to pre-fill context, prompts for each required Hansei field in sequence with controlled vocabulary visible, validates each field inline (length >=10 chars, no vague phrases, H2/H3b link requirements), assembles and appends ## Hansei block, runs arch review to confirm before exit.

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