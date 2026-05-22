## TASK-975: Bug: arch govern INTEGRITY_FIX writes ledger entry but does 
**Meta:** P3 | XS | DONE | Focus:yes | 2-code-generation | local | docs/tasks/
**Turns:** 7
**Closed-at:** 2026-05-22T12:15:41.528Z
**Rejected-at:** 2026-05-22T12:07:08.900Z
**Actor:** local
**Locked-commit:** 297ee930
**Created-at:** 2026-05-20T13:25:51.423Z
**Depends:** none

### Acceptance Criteria
- [x] Implementation file exists at declared context path
  - `file: cli/src/main/ts/application/use-cases/govern-system.ts`
- [x] Tests pass
  - `cmd: cd cli && npm test; exit: 0`
- [x] `arch check` passes
  - `cmd: node cli/dist/index.js check`
- [x] No `console.log` in non-CLI code (govern-system.ts)
  - `cmd: ! grep "console.log" cli/src/main/ts/application/use-cases/govern-system.ts`
- [x] No `any` casts in govern-system.ts
  - `cmd: ! grep -E ": any|as any" cli/src/main/ts/application/use-cases/govern-system.ts`

### Context

### Relevant Context
_confidence: 0.51_

**Files:**
- cli/src/main/ts/domain/models/task.ts _(core)_
- cli/src/main/ts/application/use-cases/govern-system.ts _(core)_
- cli/src/main/ts/infrastructure/filesystem/markdown-task-repository.ts _(core)_

**ADRs:**
- ADR-020: Focus sovereignty model

### Context Feedback
- [x] accurate — files and ADRs were on-target

#### Intent
Bug: arch govern INTEGRITY_FIX writes ledger entry but does not rewrite Focus:yes to Focus:no in archived task files, causing the same set of archived tasks to trigger INTEGRITY_FIX on every govern tick

### Hansei
**Severity:** H0
**Category:** [SpecDrift]
**Decision:** Resolved the concealment that led to previous rejection. Refactored `GovernSystem` to use an `onProgress` callback instead of direct `console.log` and introduced `ArchConfig` interface to remove all `any` casts.
**Constraint:** Domain/Use-case layer must remain free of side-effecting CLI I/O.
**Cost:** Refactored 3 files to ensure protocol compliance.
**Forward Action:** None.

### Definition of Done
- [x] All ACs checked by Auditor
- [x] `arch check` passes
