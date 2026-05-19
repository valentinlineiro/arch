## TASK-259: Automate turn-count recording in arch task done
**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | claude | cli/src/main/ts/application/use-cases/loop-engine.ts, docs/KAIZEN-LOG.md
**Turns:** 1
**Closed-at:** 2026-05-19T10:16:32.276Z
**Actor:** unknown
**Locked-commit:** b847c9f7
**Created-at:** 2026-05-19T10:12:51.121Z

### Context

Mura detection in THINK Phase 3 depends on `Turns: N` metadata in archived tasks. This field is currently manual and consistently omitted by agents, causing a total loss of cycle-time data. The system can derive turn count from git log since the task was set to IN_PROGRESS.


### Relevant Context
_confidence: 0.48_

**Files:**
- cli/src/main/ts/domain/models/task.ts _(core)_
- cli/src/main/ts/domain/models/context-index.ts _(core)_
- cli/src/main/ts/application/use-cases/review-system.ts _(domain)_
- cli/src/main/ts/domain/task.ts _(core)_
- cli/src/main/ts/application/use-cases/mark-task-done.ts _(domain)_

**ADRs:**
- ADR-017: Deterministic Observability & Operational Metrics _(enforced)_
- ADR-006: Depends Graph Validation in DriftChecker Domain Service _(enforced)_
- ADR-001: Use git as the primary state engine _(enforced)_

**Guidelines:**
- testing-a-change.md
- versioning.md

**Failure Patterns:**
- Missing Mura Signals*(Sprint v0.6.0-final)*: Although TASK-182 introduced the `Turns: N` metadata field, agents are not consistently recording this field at task completion. This creates a data gap for THINK Phase 4 (Mura detection). **Proposal:** Automate turn-count recording in the `arch task done` command or within the EXEC loop logic to remove reliance on agent judgment. _(docs/KAIZEN-LOG.md)_
- `arch review` does not validate ACs before archiving*(Sprint 3)*: TASK-031 was archived as DONE but with unchecked ACs. The reviewer detected the inconsistency but did not block archival at the time. Detection arrived late (next session). *(Resolved by TASK-078)* _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [x] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files (n/a)
- [ ] off — wrong files dominated (n/a)

### Acceptance Criteria

- [x] `mark-task-done.ts` calls `getCommitCountBetween(lockedCommit)` and assigns the result to `task.turns`.  →  grep: "getCommitCountBetween" cli/src/main/ts/application/use-cases/mark-task-done.ts
- [x] Unit test verifies `turns` is set to the git-derived count (non-zero fixture).  →  grep: "turns should be 7" cli/src/test/ts/mark-task-done.test.ts
- [x] `npm test` passes.  →  cmd: npm test --prefix cli; exit: 0
- [x] `arch review` passes.  →  cmd: arch review; exit: 0

### Definition of Done

- [x] All ACs checked.  →  prose: verified by arch task review
- [x] `arch review` passes.  →  cmd: arch review; exit: 0
