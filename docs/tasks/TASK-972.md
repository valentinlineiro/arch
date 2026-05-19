## TASK-972: Implement semantic compression layer infrastructure: precede
**Meta:** P1 | L | READY | Focus:no | 1-code-reasoning | local | docs/tasks/
**Depends:** none

### Acceptance Criteria
- [ ] Intent addressed
  - `prose: verified`
- [ ] `arch review` passes
  - `cmd: node cli/dist/index.js review`

### Context

### Relevant Context
_confidence: 0.49_

**Files:**
- cli/src/main/ts/domain/services/deterministic-hansei-checker.ts _(core)_
- cli/src/main/ts/domain/services/archive-parser.ts _(core)_
- cli/src/main/ts/domain/models/causal-relation.ts _(core)_
- cli/src/main/ts/domain/models/task.ts _(core)_
- cli/src/main/ts/domain/services/metrics-engine.ts _(core)_

**ADRs:**
- ADR-018: Adversarially Robust Epistemology & Graded Integrity _(enforced)_
- ADR-013: Two-Tier Drift Detection Architecture _(enforced)_
- ADR-016: Define the semantic boundary of the domain layer _(enforced)_

**Failure Patterns:**
- Invariant Discovery Gap*(2026-05-12)*: The boundary ambiguity between `arch govern` (deterministic enforcement) and THINK (LLM analysis) was not surfaced by any ARCH mechanism. No DriftChecker rule, no structural check, no semantic scan detected it. A human noticed it during a reflection session. The specific risk: `arch govern` triggers THINK via `runConduct()`, creating naming confusion between enforcement and advisory synthesis — with no written invariant to refuse the rationalization "THINK already participates in govern, so it can also…". **Resolution:** Constitutional split written in IDENTITY.md §7. IDEA-architectural-tension-capture proposed as a new artifact class for structural ambiguities that are not yet broken but will be misused. **The deeper pattern:** ARCH models tasks, decisions, and causal edges, but not category errors or ontological drift. Invariants that live only in the author's head do not scale. _(docs/KAIZEN-LOG.md)_
- Decision Blindness (High Velocity)*(Sprint 3)*: The agent executes architectural changes (ADR) and detects bugs (TASK-061) that stay in logs or PRs without immediate human visibility. High velocity (35 tasks/48h) makes individual monitoring impossible. **Proposal:** GOVERNANCE.md contract + INBOX.md weekly dashboard + `arch inbox` agent. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

#### Intent
Implement semantic compression layer infrastructure: precedent index over closed tasks (class/size/AC structure/Hansei distribution/closure path), novelty scoring (distance function over precedent index), governance drift detection (time-series over Hansei archive), institutional anomaly tracking, confidence calibration for THINK recommendations. Produces inputs to human decisions, not substitutes.

### Definition of Done
- [ ] All ACs checked by Auditor
- [ ] `arch review` passes

## Hansei
**Severity:** H0
**Category:** [SpecDrift]
**Decision:** Not yet started.
**Constraint:** No constraints apply — task has not started.
**Cost:** No cost incurred — task has not started.
**Forward Action:** None.