## TASK-950: ADR-023 deterministic gate invariant: Tier 2 hansei exit always 0
**Meta:** P1 | S | IN_PROGRESS | Focus:no | 2-code-generation | claude | docs/adr/ADR-023-deterministic-gate-invariant.md, cli/src/main/ts/application/commands/reflect-command.ts
**Actor:** unknown
**Created-at:** 2026-05-19T07:17:53.091Z
**Depends:** none

### Acceptance Criteria
- [ ] `docs/adr/ADR-023-deterministic-gate-invariant.md` exists and documents the principle with explicit per-command classification (deterministic vs advisory)
  - `file: docs/adr/ADR-023-deterministic-gate-invariant.md`
- [ ] `arch reflect hansei` Tier 2 exit code is always 0 regardless of LLM findings
  - `file: cli/src/main/ts/application/commands/reflect-command.ts`
- [ ] Tier 2 output header explicitly reads "ADVISORY" and states it is not a governance gate
  - `file: cli/src/main/ts/application/commands/reflect-command.ts`
- [ ] `npm test` passes
  - `cmd: npm test --prefix cli; exit: 0`
- [ ] `arch review` passes
  - `cmd: arch review; exit: 0`

### Context

### Relevant Context
_confidence: 0.47_

**Files:**
- cli/src/main/ts/domain/services/deterministic-hansei-checker.ts _(core)_
- cli/src/main/ts/domain/models/task.ts _(core)_
- cli/src/main/ts/domain/services/hansei-auditor.ts _(core)_
- cli/src/main/ts/domain/services/signal-router.ts _(core)_
- cli/src/main/ts/domain/repositories/file-system.ts _(core)_

**ADRs:**
- ADR-013: Two-Tier Drift Detection Architecture _(enforced)_
- ADR-017: Deterministic Observability & Operational Metrics _(enforced)_
- ADR-021: Refinement funnel TTL and admission gate _(enforced)_

**Guidelines:**
- testing-a-change.md
- versioning.md

**Failure Patterns:**
- Invariant Discovery Gap*(2026-05-12)*: The boundary ambiguity between `arch govern` (deterministic enforcement) and THINK (LLM analysis) was not surfaced by any ARCH mechanism. No DriftChecker rule, no structural check, no semantic scan detected it. A human noticed it during a reflection session. The specific risk: `arch govern` triggers THINK via `runConduct()`, creating naming confusion between enforcement and advisory synthesis — with no written invariant to refuse the rationalization "THINK already participates in govern, so it can also…". **Resolution:** Constitutional split written in IDENTITY.md §7. IDEA-architectural-tension-capture proposed as a new artifact class for structural ambiguities that are not yet broken but will be misused. **The deeper pattern:** ARCH models tasks, decisions, and causal edges, but not category errors or ontological drift. Invariants that live only in the author's head do not scale. _(docs/KAIZEN-LOG.md)_
- Protocol Enforcement Lag*(Sprint v0.6.0-final)*: Rollout of machine-enforced `## Hansei` (TASK-195) occurred before `DO.md` was updated (TASK-197), leading to agents following a stale protocol and being blocked by the CLI. **Proposal:** Mandate "Atomic Protocol Updates" where CLI enforcement and documentation changes are delivered in the same commit or task. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

#### Intent
ADR-023 deterministic gate invariant: Tier 2 hansei exit always 0, document LLM-advisory-only principle

### Definition of Done
- [ ] All ACs checked by Auditor
- [ ] `arch review` passes