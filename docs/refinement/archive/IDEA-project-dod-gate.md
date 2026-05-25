# IDEA: project-dod-gate — project-level Definition of Done + govern hook
**Created:** 2026-05-24
**Source:** Strategic — autonomous execution needs a termination condition
**Status:** PROMOTED
**Meta:** P1 | S | human | arch.config.json, cli/src/main/ts/application/use-cases/govern-system.ts

## Problem

`arch task loop` runs until the queue empties. A real project like a restaurant OS has 50+ tasks — the loop runs indefinitely until human intervention or budget exhaustion. There is no formal project-level DoD: no condition that says "the restaurant OS is done when these 5 acceptance criteria pass." Without it, autonomous execution has no termination oracle.

## Proposed Solution

`docs/PROJECT.md` contains a `## Definition of Done` section with verifiable predicates (same format as task ACs):

```markdown
## Definition of Done
- [ ] `cmd: curl http://localhost:3000/menu; exit: 0`
- [ ] `cmd: npm test; exit: 0`
- [ ] `file: src/routes/analytics.ts`
```

`arch govern` checks PROJECT.md DoD on every tick. When all predicates pass:
1. Appends `PROJECT_COMPLETE` to `.arch/focus-ledger.jsonl`
2. Writes a completion summary to `docs/RETRO.md`
3. Exits with a distinct exit code (2) so CI can detect project completion vs in-progress (0) vs halt (1)

`arch task loop` respects PROJECT_COMPLETE — stops even if tasks remain in queue.

## Constraint Axes
- Dependency ordering: Requires IDEA-project-scaffold (PROJECT.md exists)
- Temporal validity: Valid as soon as project-scaffold ships
- Abstraction layer: Correct — govern check + loop guard
- Observability validity: Deterministic — same predicate format as task ACs
- Priority displacement: P1 — without this, autonomous builds have no exit condition

## Gaps
- None blocking. PROJECT.md format is already established by IDEA-project-scaffold.

## Decision
PROMOTE → TASK-1006
