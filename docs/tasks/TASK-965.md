## TASK-965: Extend L3 self-archive eligibility to M tasks in 6-writing and 7-operations
**Meta:** P2 | M | DONE | Focus:yes | 2-code-generation | local | cli/src/main/ts/
**Closed-at:** 2026-05-20T16:55:00Z
**Locked-commit:** a7f0dbf6
**Depends:** none

### Gaps

`DeterministicACVerifier` has no `file-contains:` or `not-file:` predicate types. `tryL3Gate` in `mark-task-done.ts` hard-codes `['XS', 'S']`. Protected path check needs `gitRepository.getChangedFilesInLastCommit()` + `arch.config.json` `protectedPaths`. All three are bounded by ACs below.

### Acceptance Criteria
- [x] `file-contains: <path> <pattern>` predicate type added to `DeterministicACVerifier` — passes when file contains pattern, fails when absent.  →  cmd: node --import tsx --test src/test/ts/deterministic-ac-verifier.test.ts; exit: 0
- [x] `not-file: <path>` predicate type added — passes when file does not exist.  →  cmd: node --import tsx --test src/test/ts/deterministic-ac-verifier.test.ts; exit: 0
- [x] M task in `6-writing` or `7-operations` with all `cmd:`/`file:` ACs and `pass:true` is L3 eligible.  →  cmd: node --import tsx --test src/test/ts/mark-task-done.test.ts; exit: 0
- [x] M task with any `prose:` AC is NOT L3 eligible even in `6-writing`.  →  cmd: node --import tsx --test src/test/ts/mark-task-done.test.ts; exit: 0
- [x] M task in `2-code-generation` is NOT L3 eligible regardless of AC types.  →  cmd: node --import tsx --test src/test/ts/mark-task-done.test.ts; exit: 0
- [x] M task with a protected path modified is NOT L3 eligible.  →  cmd: node --import tsx --test src/test/ts/mark-task-done.test.ts; exit: 0
- [x] `arch review` passes.  →  cmd: arch review; exit: 0

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
- [x] All ACs checked by Auditor
- [x] `arch review` passes

## Hansei
**Severity:** H1
**Category:** [SpecDrift]
**Decision:** Task ACs were placeholder stubs at READY — same pattern as TASK-964. ACs rewritten before implementation. One additional discovery: `parseACLines` only recognized `cmd|file|test|prose|code` — had to add `file-contains|not-file` to the recognizer regex or predicates were silently dropped.
**Constraint:** The predicate recognizer in `parseACLines` used a hard-coded alternation that didn't account for new types. Discovered only when tests showed `type: 'unknown'` for `file-contains:` ACs.
**Cost:** One extra debugging step to find the silent drop in `parseACLines`. No architectural debt introduced.
**Forward Action:** None required — the recognizer pattern is now extensible by appending to the alternation.

## Approval
Auditor: Valentín Liñeiro
Reviewed: 2026-05-20
All 7 ACs verified against actual repo state. 15/15 ac-verifier tests pass, 26/26 mark-task-done tests pass. `arch review` exits 0.
