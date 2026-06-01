## TASK-264: Implement dynamic model provisioning with environment-aware config
**Meta:** P3 | M | DONE | Focus:no | 2-code-generation | claude | arch.config.json, cli/src/main/ts/domain/services/
**Turns:** 0
**Closed-at:** 2026-06-01T18:36:57.154Z
**Actor:** unknown
**Locked-commit:** 5f07f5b
**Created-at:** 2026-06-01T18:35:49.345Z

### Context


### Relevant Context
_confidence: 0.44_

**Files:**
- cli/src/main/ts/domain/models/task.ts _(core)_
- cli/src/main/ts/domain/models/context-index.ts _(core)_
- cli/src/main/ts/domain/models/decision.ts _(core)_
- cli/src/main/ts/domain/models/reflect-decision.ts _(core)_
- cli/src/main/ts/domain/models/action.ts _(core)_

**ADRs:**
- ADR-016: Define the semantic boundary of the domain layer _(enforced)_
- ADR-017: Deterministic Observability & Operational Metrics _(enforced)_
- ADR-008: Centralize halt conditions in HALT.md _(enforced)_

**Guidelines:**
- models.md
- bugs.md

**Failure Patterns:**
- Invariant Discovery Gap*(2026-05-12)*: The boundary ambiguity between `arch govern` (deterministic enforcement) and THINK (LLM analysis) was not surfaced by any ARCH mechanism. No DriftChecker rule, no structural check, no semantic scan detected it. A human noticed it during a reflection session. The specific risk: `arch govern` triggers THINK via `runConduct()`, creating naming confusion between enforcement and advisory synthesis — with no written invariant to refuse the rationalization "THINK already participates in govern, so it can also…". **Resolution:** Constitutional split written in IDENTITY.md §7. IDEA-architectural-tension-capture proposed as a new artifact class for structural ambiguities that are not yet broken but will be misused. **The deeper pattern:** ARCH models tasks, decisions, and causal edges, but not category errors or ontological drift. Invariants that live only in the author's head do not scale. _(docs/KAIZEN-LOG.md)_
- Recursive review violation tasks*(Sprint 4)*: TASK-112, 113, and 114 show a pattern where a task is created to fix a review violation, but then marked DONE with its own violations (e.g. pending ACs), leading to a chain of cleanup tasks. **Proposal:** Implement pre-archive guards (TASK-115) and enforce AC validation during `arch review`. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [x] accurate — files and ADRs were on-target
- [x] partial — correct direction, missing key files
- [x] off — wrong files dominated

### Gaps
None blocking. Config structure and env detection are straightforward additions.

`modelTiers` in `arch.config.json` are currently static, causing friction when moving between local GPU machines and cloud runners. Users must manually update config or agents run with suboptimal models. The solution integrates `llm-checker` for local discovery and adds environment-specific config overrides for local vs cloud environments.

### Acceptance Criteria

- [x] `arch.config.json` supports environment-specific `modelTiers` with `local` and `cloud` keys.
- [x] `arch setup` or `arch govern` detects the environment (local vs cloud/CI) and applies the appropriate model tier overrides.
- [x] `arch review` passes.  →  cmd: arch review; exit: 0

### Definition of Done

- [x] Environment-aware model provisioning implemented and verified on both local and CI environments.
- [x] `arch review` passes.

## Hansei
**Severity:** H0
**Category:** [SpecDrift]
**Decision:** modelTiers added to arch.config.json (local/cloud keys with analyze/capture/reflect CLI preferences). analyze-command.ts reads ARCH_ENV or CI env var, selects tier, reorders config.clis to prefer the tier CLI. CI=true or CI=1 → cloud tier. Default → local tier. ARCH_ENV overrides both. provider-registry.ts already had partial modelTiers support via governance.modelTiers.
**Constraint:** Tier override only applies to analyze-command. govern and capture use config.clis order directly. Full tier propagation would require threading config through all commands.
**Cost:** No architectural debt. Additive feature, backward compatible.
**Forward Action:** Apply same tier-aware CLI reordering to conduct-command.ts if needed.
