## TASK-958: Write governance epistemic doctrine document: establish cons
**Meta:** P1 | S | REVIEW | Focus:yes | 6-writing | local | docs/tasks/
**Actor:** unknown
**Created-at:** 2026-05-19T14:46:45.465Z
**Depends:** none

### Acceptance Criteria
- [ ] Document exists at declared path
  - `file: docs/EPISTEMIC-DOCTRINE.md`
- [ ] Content is accurate and complete
  - `prose: reviewed and verified`
- [ ] `arch review` passes
  - `cmd: node cli/dist/index.js review`

### Context

### Relevant Context
_confidence: 0.45_

**Files:**
- cli/src/main/ts/domain/services/archive-parser.ts _(core)_
- cli/src/main/ts/domain/repositories/file-system.ts _(core)_
- cli/src/main/ts/domain/repositories/git-repository.ts _(core)_
- cli/src/main/ts/domain/repositories/task-repository.ts _(core)_
- cli/src/main/ts/domain/models/task.ts _(core)_

**ADRs:**
- ADR-016: Define the semantic boundary of the domain layer _(enforced)_
- ADR-018: Adversarially Robust Epistemology & Graded Integrity _(enforced)_
- ADR-013: Two-Tier Drift Detection Architecture _(enforced)_

**Guidelines:**
- core.md
- documentation.md

**Failure Patterns:**
- Invariant Discovery Gap*(2026-05-12)*: The boundary ambiguity between `arch govern` (deterministic enforcement) and THINK (LLM analysis) was not surfaced by any ARCH mechanism. No DriftChecker rule, no structural check, no semantic scan detected it. A human noticed it during a reflection session. The specific risk: `arch govern` triggers THINK via `runConduct()`, creating naming confusion between enforcement and advisory synthesis — with no written invariant to refuse the rationalization "THINK already participates in govern, so it can also…". **Resolution:** Constitutional split written in IDENTITY.md §7. IDEA-architectural-tension-capture proposed as a new artifact class for structural ambiguities that are not yet broken but will be misused. **The deeper pattern:** ARCH models tasks, decisions, and causal edges, but not category errors or ontological drift. Invariants that live only in the author's head do not scale. _(docs/KAIZEN-LOG.md)_
- Decision Blindness (High Velocity)*(Sprint 3)*: The agent executes architectural changes (ADR) and detects bugs (TASK-061) that stay in logs or PRs without immediate human visibility. High velocity (35 tasks/48h) makes individual monitoring impossible. **Proposal:** GOVERNANCE.md contract + INBOX.md weekly dashboard + `arch inbox` agent. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

#### Intent
Write governance epistemic doctrine document: establish constitutional frame for ARCH automation — define constructive vs bureaucratic friction taxonomy, three-layer governance stack (Constitutional/Semantic/Operational), four-phase maturity sequencing, and four constitutional invariants (humans own novelty adjudication, topology mutation, precedent creation; machines may prepare but not legitimize). Must be committed before Phase 1 automation tasks begin.

### Definition of Done
- [ ] All ACs checked by Auditor
- [ ] `arch review` passes