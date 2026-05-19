## TASK-252: Introduce size-tiered closure and review obligations
**Meta:** P1 | M | DONE | Focus:no | 6-writing | claude | docs/TASK-FORMAT.md, docs/agents/DO.md, cli/src/main/ts/application/use-cases/mark-task-done.ts, cli/src/main/ts/domain/services/task-validator.ts
**Closed-at:** 2026-05-18T21:43:23.432Z

### Context

Currently all tasks pay the same governance cost regardless of size: Hansei block, REVIEW stage, Auditor cycle. An XS fix that touches one line carries the same closure overhead as an L architectural refactor. This creates disproportionate friction and motivates ceremonial compliance over genuine reflection.

The target model is proportional obligations:

| Size | Hansei | REVIEW stage | Auditor check |
|------|--------|--------------|---------------|
| XS | Not required | Skipped — goes directly DONE on commit | Structural only (arch review passes) |
| S | Optional | Required only if blockers were encountered | Structural only |
| M | Required | Required | Full AC verification |
| L | Required | Required | Full AC verification + Hansei audit |

"Structural only" means `arch review` passing is sufficient to close the task. "Full AC verification" means a human or Auditor agent reads the ACs and confirms implementation matches intent.

Implementation cut for this task:
- XS direct-to-DONE is implemented now.
- S keeps the existing REVIEW path in v1, but Hansei becomes optional.
- M/L keep full review semantics and required Hansei.

### Acceptance Criteria

- [x] `docs/TASK-FORMAT.md` documents the tiered obligation table with explicit rules per size.  →  prose: verified by reading TASK-FORMAT.md Hansei section
- [x] `docs/agents/DO.md` documents the tiered REVIEW path: XS transitions directly to DONE on `arch review` pass; S/M/L follow the existing path.  →  prose: verified by reading DO.md closure section
- [x] `AGENTS.md` explicitly documents the XS Auditor-bypass exception so direct-to-DONE closure does not appear to violate the default Auditor invariant.  →  prose: verified by reading AGENTS.md hard limits or DO-mode summary
- [x] `cli/src/main/ts/domain/services/task-validator.ts` enforces Hansei as optional for XS/S and required for M/L.  →  grep: "XS\|tiered\|hansei.*optional" cli/src/main/ts/domain/services/task-validator.ts
- [x] `mark-task-done.ts` skips the REVIEW stage for XS tasks and transitions directly to DONE when `arch review` passes.  →  prose: verified by reading mark-task-done.ts XS path
- [x] CLI tests cover XS direct-to-DONE path and M Hansei-required path.  →  cmd: npm test --prefix cli; exit: 0
- [x] `arch review` passes.  →  cmd: arch review; exit: 0

### Definition of Done

- [x] An XS task can be closed with `arch task done` (or equivalent) without writing a Hansei block, with `arch review` as the sole gate.
- [x] An M task without a Hansei block is rejected at closure by the validator.
- [x] `arch review` passes.  →  cmd: arch review; exit: 0

### Decisions

- **S Hansei rule:** S Hansei is always optional in this task. Blocker-sensitive Hansei for S is deferred until blocker history is persisted as structured task data.
- **XS Auditor exception:** XS direct-to-DONE is an explicit exception to the default Auditor invariant. The exception must be documented in `AGENTS.md` and `docs/agents/DO.md`, not left implicit.
- **Cycle time rule:** cycle time uses the first terminal closure transition available for the size tier: `DONE` for XS direct-close tasks, existing reviewed close path for S/M/L. No synthetic REVIEW timestamp is introduced.

## Hansei
**Severity:** H0
**Category:** [SpecDrift]

**Decision:**
S blocker-sensitive Hansei rule deferred in v1. S Hansei is always optional regardless of whether blockers were encountered, because structured blocker history is not queryable at close time in the current implementation.

**Constraint:**
Making S Hansei conditional on blocker presence requires blocker events to be persisted as structured task data — infrastructure that does not exist in this task's scope and would increase the size beyond M.

**Cost:**
S tasks that encountered significant blockers may close without Hansei in v1. The gap is accepted on the grounds that S tasks are small enough that the debt surface is bounded.

**Forward Action:**
None required. S blocker-sensitive Hansei is explicitly deferred until structured blocker history is persisted.

## Approval
Approved-by: valentinlineiro | 2026-05-19
