## TASK-242: Ship CLI as standalone npm package
**Meta:** P1 | M | REVIEW | Focus:no | 2-code-generation | claude-code | cli/
**Actor:** unknown
**Locked-commit:** a1061736
**Created-at:** 2026-05-27T07:18:01.965Z
**Depends:** none

### Context
Current CLI requires manual `npm install && npm run build` and Node.js runtime. Goal is simpler cross-platform installation via npm or pre-built binary.


### Relevant Context
_confidence: 0.44_

**Files:**
- cli/src/main/ts/domain/models/task.ts _(core)_
- cli/src/main/ts/domain/models/context-index.ts _(core)_
- cli/src/main/ts/domain/models/decision.ts _(core)_
- cli/src/main/ts/domain/models/action.ts _(core)_
- cli/src/main/ts/domain/models/reflect-decision.ts _(core)_

**ADRs:**
- ADR-025: Two-Track Versioning Architecture _(enforced)_
- ADR-003: DISPATCH output is ephemeral — exception to ADR-001 _(enforced)_
- ADR-004: Flat docs/tasks/ directory with Focus field replaces sprint/backlog split _(enforced)_

**Guidelines:**
- bugs.md
- core.md

**Failure Patterns:**
- Invariant Discovery Gap*(2026-05-12)*: The boundary ambiguity between `arch govern` (deterministic enforcement) and THINK (LLM analysis) was not surfaced by any ARCH mechanism. No DriftChecker rule, no structural check, no semantic scan detected it. A human noticed it during a reflection session. The specific risk: `arch govern` triggers THINK via `runConduct()`, creating naming confusion between enforcement and advisory synthesis — with no written invariant to refuse the rationalization "THINK already participates in govern, so it can also…". **Resolution:** Constitutional split written in IDENTITY.md §7. IDEA-architectural-tension-capture proposed as a new artifact class for structural ambiguities that are not yet broken but will be misused. **The deeper pattern:** ARCH models tasks, decisions, and causal edges, but not category errors or ontological drift. Invariants that live only in the author's head do not scale. _(docs/KAIZEN-LOG.md)_
- Missing Mura Signals*(Sprint v0.6.0-final)*: Although TASK-182 introduced the `Turns: N` metadata field, agents are not consistently recording this field at task completion. This creates a data gap for THINK Phase 4 (Mura detection). **Proposal:** Automate turn-count recording in the `arch task done` command or within the EXEC loop logic to remove reliance on agent judgment. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

### Gaps
None — implementation already complete. Package published as `@valentinlineiro/arch` on npm. This session is auditing completion state.

### Acceptance Criteria
- [x] CLI publishable as standalone npm package (or bundled binary via esbuild/pkg) → file: cli/package.json
- [x] Installation documented in README → file: README.md
- [x] All existing commands work post-package → file: cli/dist/index.js
- [x] Build pipeline produces distributable artifact → file: cli/tsup.config.ts

### Definition of Done
- [x] All ACs verified → prose: all four ACs verified against live repo state — package published at @valentinlineiro/arch@1.2.0
- [x] `arch review` passes → cmd: node cli/dist/index.js review; exit: 0

## Hansei
**Severity:** H1
**Category:** [AuditGap]
**Decision:** Implementation was completed in a prior session without moving the task through IN_PROGRESS → REVIEW → DONE. The package shipped (`@valentinlineiro/arch` v1.0.0 through v1.2.0, 4 versions on npm) while the task stayed READY. Audit session (this one) closed the gap by verifying all ACs against live state and running the closure protocol.
**Constraint:** Task predates TASK-195 archiving requirements. Closure audit is the corrective action — no re-implementation required.
**Cost:** Minor governance drift: task lifecycle did not match actual delivery timeline. No user-facing or architectural cost.
**Forward Action:** Prefer `arch task start` at implementation time to prevent lifecycle gaps. No IDEA needed — this is a discipline reminder, not a systemic gap.
