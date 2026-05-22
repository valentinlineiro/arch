## TASK-986: Execute Human-Centric CLI Refactoring
**Meta:** P3 | M | REVIEW | Focus:no | 3-refactoring | local | docs/tasks/
**Depends:** none

### Acceptance Criteria
- [x] Intent addressed
  - `prose: verified`
- [x] `arch check` passes
  - `cmd: node cli/dist/index.js check`

### Gaps
- **Dispatcher Logic**: Successfully transitioned from hardcoded `switch` to dynamic `CommandDispatcher`. Verified against all public commands.
- **Documentation Drift**: AGENTS.md, DO.md, THINK.md, and README.md updated to reflect new names.

### Context

### Relevant Context
_confidence: 0.53_

**Files:**
- cli/src/main/ts/domain/models/task.ts _(core)_
- cli/src/main/ts/domain/repositories/git-repository.ts _(core)_
- cli/src/main/ts/domain/repositories/task-repository.ts _(core)_
- cli/src/main/ts/domain/services/human-coordination-service.ts _(core)_

**ADRs:**
- ADR-001: Use git as the primary state engine _(enforced)_
- ADR-004: Flat docs/tasks/ directory with Focus field replaces sprint/backlog split _(enforced)_
- ADR-015: Causal Signal Arbitration Layer _(enforced)_

**Failure Patterns:**
- Decision Blindness (High Velocity)*(Sprint 3)*: The agent executes architectural changes (ADR) and detects bugs (TASK-061) that stay in logs or PRs without immediate human visibility. High velocity (35 tasks/48h) makes individual monitoring impossible. **Proposal:** GOVERNANCE.md contract + INBOX.md weekly dashboard + `arch inbox` agent. _(docs/KAIZEN-LOG.md)_
- Invariant Discovery Gap*(2026-05-12)*: The boundary ambiguity between `arch govern` (deterministic enforcement) and THINK (LLM analysis) was not surfaced by any ARCH mechanism. No DriftChecker rule, no structural check, no semantic scan detected it. A human noticed it during a reflection session. The specific risk: `arch govern` triggers THINK via `runConduct()`, creating naming confusion between enforcement and advisory synthesis — with no written invariant to refuse the rationalization "THINK already participates in govern, so it can also…". **Resolution:** Constitutional split written in IDENTITY.md §7. IDEA-architectural-tension-capture proposed as a new artifact class for structural ambiguities that are not yet broken but will be misused. **The deeper pattern:** ARCH models tasks, decisions, and causal edges, but not category errors or ontological drift. Invariants that live only in the author's head do not scale. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

#### Intent
Execute Human-Centric CLI Refactoring

### Definition of Done
- [ ] All ACs checked by Auditor
- [ ] `arch check` passes

## Hansei
**Severity:** H0
**Category:** [SpecDrift]
**Decision:** Refactored CLI surface and internal architecture to prioritize human intuitive naming over philosophical/LLM-oriented names.
**Constraint:** The original `index.ts` was a bottleneck for maintenance; introducing `CommandDispatcher` solved this while aligning with "Productization" goals.
**Cost:** High number of files touched (renaming), but mitigated by comprehensive build verification and drift checking.
**Forward Action:** None.