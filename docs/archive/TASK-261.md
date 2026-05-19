## TASK-261: Define cross-layer coverage identity model for drift signals and IDEAs
**Meta:** P1 | S | DONE | Focus:no | 6-writing | claude | docs/refinement/, cli/src/main/ts/application/use-cases/drift-checker.ts
**Turns:** 1
**Closed-at:** 2026-05-19T12:41:37.664Z
**Actor:** unknown
**Locked-commit:** 849d72c2
**Created-at:** 2026-05-19T12:39:28.334Z

### Context

ARCH's observation layer (DriftChecker signals) and intervention layer (IDEAs) are semantically coupled but have no shared identity primitive. The system cannot mechanically determine whether a drift signal is already covered by a pending IDEA, leading to potential duplicate IDEAs and unverifiable backlog completeness. This task defines the identity model (Option A, B, or C) before any implementation.


### Relevant Context
_confidence: 0.43_

**Files:**
- cli/src/main/ts/domain/models/context-index.ts _(core)_
- cli/src/main/ts/domain/models/task.ts _(core)_
- cli/src/main/ts/domain/models/causal-signal.ts _(core)_
- cli/src/main/ts/domain/task.ts _(core)_
- cli/src/main/ts/domain/models/reflect-decision.ts _(core)_

**ADRs:**
- ADR-016: Define the semantic boundary of the domain layer _(enforced)_
- ADR-006: Depends Graph Validation in DriftChecker Domain Service _(enforced)_
- ADR-004: Flat docs/tasks/ directory with Focus field replaces sprint/backlog split _(enforced)_

**Guidelines:**
- core.md
- documentation.md

**Failure Patterns:**
- Decision Blindness (High Velocity)*(Sprint 3)*: The agent executes architectural changes (ADR) and detects bugs (TASK-061) that stay in logs or PRs without immediate human visibility. High velocity (35 tasks/48h) makes individual monitoring impossible. **Proposal:** GOVERNANCE.md contract + INBOX.md weekly dashboard + `arch inbox` agent. _(docs/KAIZEN-LOG.md)_
- Recursive review violation tasks*(Sprint 4)*: TASK-112, 113, and 114 show a pattern where a task is created to fix a review violation, but then marked DONE with its own violations (e.g. pending ACs), leading to a chain of cleanup tasks. **Proposal:** Implement pre-archive guards (TASK-115) and enforce AC validation during `arch review`. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

### Acceptance Criteria

- [x] An ADR or design document in `docs/adr/` or `docs/refinement/` specifies the chosen coverage identity model (IDEA-centric, drift-centric, or relational primitive) with rationale.  →  file: docs/adr/ADR-024-drift-coverage-identity-model.md
- [x] The chosen model is unambiguous enough to guide downstream implementation of coverage queries.  →  grep: Coverage query algorithm docs/adr/ADR-024-drift-coverage-identity-model.md
- [x] `arch review` passes.  →  cmd: arch review; exit: 0

### Definition of Done

- [ ] Coverage identity model decision recorded as an ADR or design document.
- [ ] `arch review` passes.
