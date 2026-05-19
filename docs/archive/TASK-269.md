## TASK-269: Grandfather legacy tasks in arch review HanseiPresent check
**Meta:** P2 | XS | DONE | Focus:no | 2-code-generation | claude | cli/src/main/ts/application/use-cases/drift-checker.ts
**Turns:** 0
**Closed-at:** 2026-05-19T10:42:52.819Z
**Actor:** unknown
**Locked-commit:** 53fc865a
**Created-at:** 2026-05-19T10:42:09.792Z

### Context

The `HanseiPresent` check in `arch review` was flagging XS/S archived tasks, producing noise. DriftChecker was updated (TASK-950 side effect) to enforce `HanseiPresent` only for M/L/XL tasks — the correct rule per ADR-019. ID-based grandfathering is not needed; size-based filtering is simpler and semantically correct.


### Relevant Context
_confidence: 0.49_

**Files:**
- cli/src/main/ts/domain/models/task.ts _(core)_
- cli/src/main/ts/domain/models/context-index.ts _(core)_
- cli/src/main/ts/domain/services/deterministic-hansei-checker.ts _(core)_
- cli/src/main/ts/domain/task.ts _(core)_
- cli/src/main/ts/domain/services/signal-router.ts _(core)_

**ADRs:**
- ADR-016: Define the semantic boundary of the domain layer _(enforced)_
- ADR-003: DISPATCH output is ephemeral — exception to ADR-001 _(enforced)_
- ADR-006: Depends Graph Validation in DriftChecker Domain Service _(enforced)_

**Guidelines:**
- testing-a-change.md
- versioning.md

**Failure Patterns:**
- Recursive review violation tasks*(Sprint 4)*: TASK-112, 113, and 114 show a pattern where a task is created to fix a review violation, but then marked DONE with its own violations (e.g. pending ACs), leading to a chain of cleanup tasks. **Proposal:** Implement pre-archive guards (TASK-115) and enforce AC validation during `arch review`. _(docs/KAIZEN-LOG.md)_
- Stealth Merge Commits*(Sprint 6)*: Implicit merges from `git pull` violated the "No-Merge" policy. `arch review` initially failed to block them effectively due to a bug in `MergeCommitCheck` (it found the last 20 merges instead of checking the last 20 commits). **Resolved:** Fixed `MergeCommitCheck` in `cli/src/main/ts/infrastructure/cli/git-cli.ts` and hardened protocol. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

### Acceptance Criteria

- [x] `DriftChecker.ts` only enforces `HanseiPresent` for M/L/XL tasks.  →  grep: \['M', 'L', 'XL'\].includes cli/src/main/ts/application/use-cases/drift-checker.ts
- [x] `arch review` emits no HanseiPresent warnings for XS/S archived tasks.
- [x] `arch review` passes.  →  cmd: arch review; exit: 0

### Definition of Done

- [x] Size-based HanseiPresent filtering implemented in DriftChecker (TASK-950 side effect).
- [x] `arch review` passes.
