## TASK-965: Extend L3 self-archive eligibility to M tasks in 6-writing and 7-operations
**Meta:** P2 | M | IN_PROGRESS | Focus:yes | 2-code-generation | local | cli/src/main/ts/
**Locked-commit:** a7f0dbf6
**Depends:** none

### Gaps

`DeterministicACVerifier` has no `file-contains:` or `not-file:` predicate types. `tryL3Gate` in `mark-task-done.ts` hard-codes `['XS', 'S']`. Protected path check needs `gitRepository.getChangedFilesInLastCommit()` + `arch.config.json` `protectedPaths`. All three are bounded by ACs below.

### Acceptance Criteria
- [ ] `file-contains: <path> <pattern>` predicate type added to `DeterministicACVerifier` — passes when file contains pattern, fails when absent.  →  cmd: node --import tsx --test src/test/ts/deterministic-ac-verifier.test.ts; exit: 0
- [ ] `not-file: <path>` predicate type added — passes when file does not exist.  →  cmd: node --import tsx --test src/test/ts/deterministic-ac-verifier.test.ts; exit: 0
- [ ] M task in `6-writing` or `7-operations` with all `cmd:`/`file:` ACs and `pass:true` is L3 eligible.  →  cmd: node --import tsx --test src/test/ts/mark-task-done.test.ts; exit: 0
- [ ] M task with any `prose:` AC is NOT L3 eligible even in `6-writing`.  →  cmd: node --import tsx --test src/test/ts/mark-task-done.test.ts; exit: 0
- [ ] M task in `2-code-generation` is NOT L3 eligible regardless of AC types.  →  cmd: node --import tsx --test src/test/ts/mark-task-done.test.ts; exit: 0
- [ ] M task with a protected path modified is NOT L3 eligible.  →  cmd: node --import tsx --test src/test/ts/mark-task-done.test.ts; exit: 0
- [ ] `arch review` passes.  →  cmd: arch review; exit: 0

### Context

### Relevant Context
_confidence: 0.46_

**Files:**
- cli/src/main/ts/domain/services/deterministic-ac-verifier.ts _(core)_
- cli/src/main/ts/domain/models/task.ts _(core)_
- cli/src/main/ts/domain/repositories/git-repository.ts _(core)_
- cli/src/main/ts/domain/models/provenance.ts _(core)_
- cli/src/main/ts/application/use-cases/validate-task-acs.ts _(domain)_

**ADRs:**
- ADR-004: Flat docs/tasks/ directory with Focus field replaces sprint/backlog split _(enforced)_
- ADR-006: Depends Graph Validation in DriftChecker Domain Service _(enforced)_
- ADR-008: Centralize halt conditions in HALT.md _(enforced)_

**Guidelines:**
- testing-a-change.md
- versioning.md

**Failure Patterns:**
- Invariant Discovery Gap*(2026-05-12)*: The boundary ambiguity between `arch govern` (deterministic enforcement) and THINK (LLM analysis) was not surfaced by any ARCH mechanism. No DriftChecker rule, no structural check, no semantic scan detected it. A human noticed it during a reflection session. The specific risk: `arch govern` triggers THINK via `runConduct()`, creating naming confusion between enforcement and advisory synthesis — with no written invariant to refuse the rationalization "THINK already participates in govern, so it can also…". **Resolution:** Constitutional split written in IDENTITY.md §7. IDEA-architectural-tension-capture proposed as a new artifact class for structural ambiguities that are not yet broken but will be misused. **The deeper pattern:** ARCH models tasks, decisions, and causal edges, but not category errors or ontological drift. Invariants that live only in the author's head do not scale. _(docs/KAIZEN-LOG.md)_
- Legacy tasks with stale dependencies*(Sprint 3)*: TASK-007, TASK-014, TASK-021 referenced RETRO.md, HUMAN.md, and monolithic SPRINT.md — all deleted in Sprint 3. Required manual triage. Signal: when an artifact is deleted, actively search for references in the backlog. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

#### Intent
Extend L3 self-archive eligibility to M tasks in 6-writing and 7-operations classes when all ACs have cmd:/file: predicates and DeterministicACVerifier returns pass:true and no protected path was modified. Separately add richer cmd: predicate templates: coverage threshold, file content assertion, negative assertion.

### Definition of Done
- [ ] All ACs checked by Auditor
- [ ] `arch review` passes

## Hansei
**Severity:** H0
**Category:** [SpecDrift]
**Decision:** Pending — task not yet complete.
**Constraint:** Pending — task not yet complete.
**Cost:** Pending — task not yet complete.
**Forward Action:** Pending — task not yet complete.