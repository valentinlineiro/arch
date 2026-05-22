## TASK-988: capture ADR for CLI Refactoring
**Meta:** P3 | S | DONE | Focus:no | 6-writing | local | docs/tasks/
**Closed-at:** 2026-05-22T09:41:46.008Z
**Actor:** unknown
**Created-at:** 2026-05-22T09:41:30.560Z
**Depends:** none

### Acceptance Criteria
- [ ] Document exists at declared path
  - `file: (path)`
- [ ] Content is accurate and complete
  - `prose: reviewed and verified`
- [ ] `arch check` passes
  - `cmd: node cli/dist/index.js review`

### Context

### Relevant Context
_confidence: 0.41_

**Files:**
- cli/src/main/ts/domain/repositories/file-system.ts _(core)_
- cli/src/main/ts/domain/repositories/git-repository.ts _(core)_
- cli/src/main/ts/domain/repositories/task-repository.ts _(core)_
- cli/src/main/ts/domain/services/verifiability-scorer.ts _(core)_
- cli/src/main/ts/application/use-cases/create-task.ts _(domain)_

**ADRs:**
- ADR-012: Exec/Bridge Layer Bugfixes - maxBuffer, buildCommand signature, local routing _(enforced)_
- ADR-022: Census Budget Recalibration for Capture Template _(advisory)_

**Guidelines:**
- core.md
- documentation.md

**Failure Patterns:**
- Invariant Discovery Gap*(2026-05-12)*: The boundary ambiguity between `arch govern` (deterministic enforcement) and THINK (LLM analysis) was not surfaced by any ARCH mechanism. No DriftChecker rule, no structural check, no semantic scan detected it. A human noticed it during a reflection session. The specific risk: `arch govern` triggers THINK via `runConduct()`, creating naming confusion between enforcement and advisory synthesis — with no written invariant to refuse the rationalization "THINK already participates in govern, so it can also…". **Resolution:** Constitutional split written in IDENTITY.md §7. IDEA-architectural-tension-capture proposed as a new artifact class for structural ambiguities that are not yet broken but will be misused. **The deeper pattern:** ARCH models tasks, decisions, and causal edges, but not category errors or ontological drift. Invariants that live only in the author's head do not scale. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

#### Intent
capture ADR for CLI Refactoring

### Definition of Done
- [ ] All ACs checked by Auditor
- [ ] `arch check` passes