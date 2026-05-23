## TASK-991: Resolve Hansei contradiction between DO.md and TASK-FORMAT.md
**Meta:** P2 | XS | DONE | Focus:yes | default | local | docs/tasks/
**Turns:** 0
**Closed-at:** 2026-05-23T20:43:35.356Z
**Actor:** unknown
**Locked-commit:** 262b9d14
**Created-at:** 2026-05-23T20:41:58.756Z
**Depends:** none

### Acceptance Criteria
- [x] DO.md:20 updated to match TASK-FORMAT.md triggered-only language for XS/S Hansei
  - `grep: "triggered-only for XS/S" docs/agents/DO.md`
- [x] Remove "because the close transition enforces its presence" from DO.md
  - `prose: "close transition enforces" phrase removed from DO.md — verified`
- [x] Verify alignment: AGENTS.md, TASK-FORMAT.md, and DO.md agree on same rule
  - `prose: AGENTS.md says optional-for-XS/S, TASK-FORMAT.md says triggered-basis, DO.md says triggered-only for XS/S — all aligned`

### Context


### Relevant Context
_confidence: 0.45_

**Files:**
- cli/src/main/ts/domain/models/task.ts _(core)_
- cli/src/main/ts/domain/models/context-index.ts _(core)_
- cli/src/main/ts/domain/models/action.ts _(core)_
- cli/src/main/ts/domain/models/decision.ts _(core)_
- cli/src/main/ts/domain/task.ts _(core)_

**ADRs:**
- ADR-006: Depends Graph Validation in DriftChecker Domain Service _(enforced)_
- ADR-013: Two-Tier Drift Detection Architecture _(enforced)_
- ADR-017: Deterministic Observability & Operational Metrics _(enforced)_

**Guidelines:**
- core.md

**Failure Patterns:**
- Invariant Discovery Gap*(2026-05-12)*: The boundary ambiguity between `arch govern` (deterministic enforcement) and THINK (LLM analysis) was not surfaced by any ARCH mechanism. No DriftChecker rule, no structural check, no semantic scan detected it. A human noticed it during a reflection session. The specific risk: `arch govern` triggers THINK via `runConduct()`, creating naming confusion between enforcement and advisory synthesis — with no written invariant to refuse the rationalization "THINK already participates in govern, so it can also…". **Resolution:** Constitutional split written in IDENTITY.md §7. IDEA-architectural-tension-capture proposed as a new artifact class for structural ambiguities that are not yet broken but will be misused. **The deeper pattern:** ARCH models tasks, decisions, and causal edges, but not category errors or ontological drift. Invariants that live only in the author's head do not scale. _(docs/KAIZEN-LOG.md)_
- Protocol Enforcement Lag*(Sprint v0.6.0-final)*: Rollout of machine-enforced `## Hansei` (TASK-195) occurred before `DO.md` was updated (TASK-197), leading to agents following a stale protocol and being blocked by the CLI. **Proposal:** Mandate "Atomic Protocol Updates" where CLI enforcement and documentation changes are delivered in the same commit or task. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [x] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

#### Intent
Harmonize Hansei requirement for XS/S tasks: DO.md says "always required", TASK-FORMAT.md and AGENTS.md say "triggered-only". Align DO.md to the spec.

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
