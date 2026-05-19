## TASK-971: Refresh status language in README.md and docs/ROADMAP.md: de
**Meta:** P3 | XS | READY | Focus:no | 6-writing | local | docs/tasks/
**Actor:** unknown
**Created-at:** 2026-05-19T14:47:36.232Z
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
- cli/src/main/ts/domain/models/reflect-decision.ts _(core)_
- cli/src/main/ts/domain/models/causal-relation.ts _(core)_
- cli/src/main/ts/domain/models/task.ts _(core)_
- cli/src/main/ts/application/use-cases/lightweight-metrics-refresh.ts _(domain)_
- cli/src/main/ts/application/use-cases/reflect-decision-log.ts _(domain)_

**ADRs:**
- ADR-004: Flat docs/tasks/ directory with Focus field replaces sprint/backlog split _(enforced)_
- ADR-001: Use git as the primary state engine _(enforced)_
- ADR-013: Two-Tier Drift Detection Architecture _(enforced)_

**Guidelines:**
- core.md
- documentation.md

**Failure Patterns:**
- Invariant Discovery Gap*(2026-05-12)*: The boundary ambiguity between `arch govern` (deterministic enforcement) and THINK (LLM analysis) was not surfaced by any ARCH mechanism. No DriftChecker rule, no structural check, no semantic scan detected it. A human noticed it during a reflection session. The specific risk: `arch govern` triggers THINK via `runConduct()`, creating naming confusion between enforcement and advisory synthesis — with no written invariant to refuse the rationalization "THINK already participates in govern, so it can also…". **Resolution:** Constitutional split written in IDENTITY.md §7. IDEA-architectural-tension-capture proposed as a new artifact class for structural ambiguities that are not yet broken but will be misused. **The deeper pattern:** ARCH models tasks, decisions, and causal edges, but not category errors or ontological drift. Invariants that live only in the author's head do not scale. _(docs/KAIZEN-LOG.md)_
- Phantom Archive Sync Latency*(Sprint v0.6.0-final)*: Tasks marked `DONE` by an Auditor (human or agent) remain in `docs/tasks/` until the next `arch govern` tick. This creates a "stale backlog" window where `arch status` and INBOX show tasks that are technically complete. **Proposal:** Integrate phantom-archive sync directly into `arch task done`. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

#### Intent
Refresh status language in README.md and docs/ROADMAP.md: describe ARCH as operational alpha, distinguish current strengths from remaining 1.0.0 gap, update roadmap so govern/reflect split is treated as implemented with residual work framed as boundary hardening.

### Definition of Done
- [ ] All ACs checked by Auditor  →  prose: Auditor verifies each AC against repo state
- [ ] `arch review` passes  →  cmd: arch review; exit: 0

## Hansei
**Severity:** H0
**Category:** [SpecDrift]
**Decision:** Not yet started.
**Constraint:** No constraints apply — task has not started.
**Cost:** No cost incurred — task has not started.
**Forward Action:** No forward action required.