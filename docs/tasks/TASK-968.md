## TASK-968: Run architectural review of CLI with three outputs: (1) boun
**Meta:** P1 | S | READY | Focus:no | 6-writing | local | docs/tasks/
**Actor:** unknown
**Created-at:** 2026-05-19T14:47:35.886Z
**Depends:** none

### Acceptance Criteria
- [ ] Document exists at declared path
  - `file: (path)`
- [ ] Content is accurate and complete
  - `prose: reviewed and verified`
- [ ] `arch review` passes
  - `cmd: node cli/dist/index.js review`

### Context

### Relevant Context
_confidence: 0.45_

**Files:**
- cli/src/main/ts/domain/services/reviewer.ts _(core)_
- cli/src/main/ts/application/use-cases/reflect-influence-report.ts _(domain)_
- cli/src/main/ts/application/commands/corpus-audit-command.ts _(domain)_
- cli/src/main/ts/application/commands/report-command.ts _(domain)_
- cli/src/main/ts/application/commands/review-command.ts _(domain)_

**ADRs:**
- ADR-012: Exec/Bridge Layer Bugfixes - maxBuffer, buildCommand signature, local routing _(enforced)_
- ADR-013: Two-Tier Drift Detection Architecture _(enforced)_
- ADR-016: Define the semantic boundary of the domain layer _(enforced)_

**Guidelines:**
- core.md
- documentation.md

**Failure Patterns:**
- Invariant Discovery Gap*(2026-05-12)*: The boundary ambiguity between `arch govern` (deterministic enforcement) and THINK (LLM analysis) was not surfaced by any ARCH mechanism. No DriftChecker rule, no structural check, no semantic scan detected it. A human noticed it during a reflection session. The specific risk: `arch govern` triggers THINK via `runConduct()`, creating naming confusion between enforcement and advisory synthesis — with no written invariant to refuse the rationalization "THINK already participates in govern, so it can also…". **Resolution:** Constitutional split written in IDENTITY.md §7. IDEA-architectural-tension-capture proposed as a new artifact class for structural ambiguities that are not yet broken but will be misused. **The deeper pattern:** ARCH models tasks, decisions, and causal edges, but not category errors or ontological drift. Invariants that live only in the author's head do not scale. _(docs/KAIZEN-LOG.md)_
- Batch lock commit fails TASK-ID validator*(Sprint 3)*: Locking 4 tasks in a `[SPRINT]` commit caused `arch review` to report a format violation. The validator assumes a single TASK-ID per commit — batch planning commits are an uncovered edge case. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

#### Intent
Run architectural review of CLI with three outputs: (1) boundary violation map across application/domain/infrastructure layers and command wiring, (2) readability audit distinguishing necessary comments from comment volume caused by unclear structure, (3) recommendation set split into direct refactors / issues to become tasks / acceptable debt. Produce written report.

### Definition of Done
- [ ] All ACs checked by Auditor
- [ ] `arch review` passes