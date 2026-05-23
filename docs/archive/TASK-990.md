## TASK-990: Fix meta line regex - add Turns capture group, document Locked-commit and auxiliary fields
**Meta:** P2 | S | DONE | Focus:no | 6-writing | local | docs/tasks/
**Turns:** 0
**Closed-at:** 2026-05-23T23:33:27.720Z
**Actor:** unknown
**Locked-commit:** 262b9d14
**Created-at:** 2026-05-23T23:32:42.318Z
**Depends:** none

### Acceptance Criteria
- [x] Add `( \| Turns: (?<turns>\d+))?` capture group to Meta line regex in task-validator.ts
  - `grep: "turns" cli/src/main/ts/domain/services/task-validator.ts`
- [x] Add `## Auxiliary Fields` section to TASK-FORMAT.md documenting Locked-commit, Created-at, Actor
  - `grep: "Auxiliary Fields" docs/TASK-FORMAT.md`
- [x] Locked-commit documented as persisted below Meta line (not in it), per AGENTS.md Invariants
  - `grep: "Locked-commit" docs/TASK-FORMAT.md`
- [x] TASK-FORMAT.md example shows Turns inside Meta line (e.g., `| Turns: 12`)
  - `grep: "Turns: " docs/TASK-FORMAT.md`

### Context


### Relevant Context
_confidence: 0.46_

**Files:**
- cli/src/main/ts/domain/models/task.ts _(core)_
- cli/src/main/ts/domain/models/context-index.ts _(core)_
- cli/src/main/ts/domain/models/action.ts _(core)_
- cli/src/main/ts/domain/models/decision.ts _(core)_
- cli/src/main/ts/domain/task.ts _(core)_

**ADRs:**
- ADR-006: Depends Graph Validation in DriftChecker Domain Service _(enforced)_
- ADR-016: Define the semantic boundary of the domain layer _(enforced)_
- ADR-004: Flat docs/tasks/ directory with Focus field replaces sprint/backlog split _(enforced)_

**Guidelines:**
- core.md
- documentation.md

**Failure Patterns:**
- Invariant Discovery Gap*(2026-05-12)*: The boundary ambiguity between `arch govern` (deterministic enforcement) and THINK (LLM analysis) was not surfaced by any ARCH mechanism. No DriftChecker rule, no structural check, no semantic scan detected it. A human noticed it during a reflection session. The specific risk: `arch govern` triggers THINK via `runConduct()`, creating naming confusion between enforcement and advisory synthesis — with no written invariant to refuse the rationalization "THINK already participates in govern, so it can also…". **Resolution:** Constitutional split written in IDENTITY.md §7. IDEA-architectural-tension-capture proposed as a new artifact class for structural ambiguities that are not yet broken but will be misused. **The deeper pattern:** ARCH models tasks, decisions, and causal edges, but not category errors or ontological drift. Invariants that live only in the author's head do not scale. _(docs/KAIZEN-LOG.md)_
- Recursive review violation tasks*(Sprint 4)*: TASK-112, 113, and 114 show a pattern where a task is created to fix a review violation, but then marked DONE with its own violations (e.g. pending ACs), leading to a chain of cleanup tasks. **Proposal:** Implement pre-archive guards (TASK-115) and enforce AC validation during `arch check`. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [x] accurate — files and ADRs were on-target
- [x] partial — correct direction, missing key files
- [x] off — wrong files dominated

#### Intent
Fix two Meta line specification defects: Turns field missing from regex, and Locked-commit (plus Created-at, Actor) undocumented in TASK-FORMAT.md.

### Definition of Done
- [x] All ACs checked by Auditor
- [x] `arch review` passes

## Hansei
**Severity:** H0
**Category:** [SpecDrift]
**Decision:** Not yet started.
**Constraint:** No constraints apply — task has not started.
**Cost:** No cost incurred — task has not started.
**Forward Action:** None.

## Hansei
**Severity:** H1
**Category:** [SpecDrift]
**Decision:** Meta line regex already had Turns capture group — AC 1 was pre-implemented. TASK-FORMAT.md was missing Auxiliary Fields section and Locked-commit documentation. Added both. Turns example was present.
**Constraint:** Pre-existing regex was correct; only the documentation lagged behind.
**Cost:** No code changes required. Documentation only.
**Forward Action:** None required.
