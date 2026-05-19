## TASK-284: Add task template linter to arch review for Definition of Ready validation
**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | claude | cli/src/main/ts/
**Turns:** 2
**Closed-at:** 2026-05-19T11:47:41.782Z
**Actor:** unknown
**Locked-commit:** 37186c5f
**Created-at:** 2026-05-19T11:45:49.757Z

### Context

CORE.md requires tasks to comply with TASK-FORMAT.md before READY status, but this is currently manual. TASK-031 was archived DONE without checked ACs because format was never validated. This task adds a schema check to `arch review` that parses READY/REVIEW tasks and fails if Meta line, Acceptance Criteria, or Definition of Done are missing or malformed.


### Relevant Context
_confidence: 0.48_

**Files:**
- cli/src/main/ts/domain/models/task.ts _(core)_
- cli/src/main/ts/domain/task.ts _(core)_
- cli/src/main/ts/domain/models/context-index.ts _(core)_
- cli/src/main/ts/application/use-cases/mark-task-in-progress.ts _(domain)_
- cli/src/main/ts/domain/models/event.ts _(core)_

**ADRs:**
- ADR-006: Depends Graph Validation in DriftChecker Domain Service _(enforced)_
- ADR-007: Census Context Budget Check in DriftChecker _(enforced)_
- ADR-008: Centralize halt conditions in HALT.md _(enforced)_

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

### Acceptance Criteria

- [ ] `arch review` parses `docs/tasks/*.md` with status READY or REVIEW and validates: Meta line present with valid Size, Acceptance Criteria section present, Definition of Done section present.
- [ ] A violation produces a non-zero exit from `arch review` with a clear error message identifying the malformed task.
- [ ] `arch review` passes.  →  cmd: arch review; exit: 0

### Definition of Done

- [ ] Task template linter implemented in arch review; tested against both valid and invalid task files.
- [ ] `arch review` passes.
