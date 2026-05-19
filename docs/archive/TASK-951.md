## TASK-951: Add idea: commit exception to core.md
**Meta:** P1 | XS | DONE | Focus:no | 6-writing | local | docs/guidelines/core.md
**Turns:** 0
**Closed-at:** 2026-05-19T12:54:16.861Z
**Actor:** unknown
**Locked-commit:** a11645f2
**Created-at:** 2026-05-19T12:53:56.107Z
**Depends:** none

### Context

`docs/guidelines/core.md` states every commit must reference a TASK-ID, but does not document the `idea:` exception. The exception exists in `AGENTS.md` ("Exception: `idea:` commits for IDEA drafts do not require a TASK-ID") but is absent from `core.md`, creating ambiguity for agents that load only the guidelines.


### Relevant Context
_confidence: 0.44_

**Files:**
- cli/src/main/ts/domain/services/reviewer.ts _(core)_
- cli/src/main/ts/application/use-cases/focus-ledger.ts _(domain)_
- cli/src/main/ts/domain/repositories/file-system.ts _(core)_
- cli/src/main/ts/domain/models/feedback-signal.ts _(core)_
- cli/src/main/ts/domain/repositories/task-repository.ts _(core)_

**ADRs:**
- ADR-003: DISPATCH output is ephemeral — exception to ADR-001 _(enforced)_
- ADR-021: Refinement funnel TTL and admission gate _(enforced)_
- ADR-017: Deterministic Observability & Operational Metrics _(enforced)_

**Guidelines:**
- core.md
- documentation.md

**Failure Patterns:**
- Invariant Discovery Gap*(2026-05-12)*: The boundary ambiguity between `arch govern` (deterministic enforcement) and THINK (LLM analysis) was not surfaced by any ARCH mechanism. No DriftChecker rule, no structural check, no semantic scan detected it. A human noticed it during a reflection session. The specific risk: `arch govern` triggers THINK via `runConduct()`, creating naming confusion between enforcement and advisory synthesis — with no written invariant to refuse the rationalization "THINK already participates in govern, so it can also…". **Resolution:** Constitutional split written in IDENTITY.md §7. IDEA-architectural-tension-capture proposed as a new artifact class for structural ambiguities that are not yet broken but will be misused. **The deeper pattern:** ARCH models tasks, decisions, and causal edges, but not category errors or ontological drift. Invariants that live only in the author's head do not scale. _(docs/KAIZEN-LOG.md)_
- Completed Task Stagnation*(Sprint 5)*: `TASK-117` was marked DONE but remained in `docs/tasks/`, consuming context and potentially misleading agents. **Proposal:** Implement "Archival Guard" in THINK mode to autonomously move DONE tasks to `docs/archive/`. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

### Acceptance Criteria

- [ ] `docs/guidelines/core.md` commit section documents the `idea:` exception explicitly.  →  grep: "idea:" docs/guidelines/core.md
- [ ] `arch review` passes.  →  cmd: arch review; exit: 0

### Definition of Done

- [ ] All ACs checked.
- [ ] `arch review` passes.  →  cmd: arch review; exit: 0
