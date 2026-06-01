## TASK-272: Add Local-First Decomposition heuristic to THINK refinement protocol
**Meta:** P3 | S | DONE | Focus:no | 6-writing | claude-code | docs/agents/THINK.md
**Turns:** 0
**Closed-at:** 2026-06-01T18:41:20.108Z
**Actor:** unknown
**Locked-commit:** a08c83f
**Created-at:** 2026-06-01T18:37:07.782Z

### Context


### Relevant Context
_confidence: 0.50_

**Files:**
- cli/src/main/ts/domain/models/task.ts _(core)_
- cli/src/main/ts/application/use-cases/check-system.ts _(domain)_
- cli/src/main/ts/domain/services/reviewer.ts _(core)_
- cli/src/main/ts/application/use-cases/drift-checker.ts _(domain)_
- cli/src/main/ts/application/use-cases/focus-ledger.ts _(domain)_

**ADRs:**
- ADR-008: Centralize halt conditions in HALT.md _(enforced)_
- ADR-004: Flat docs/tasks/ directory with Focus field replaces sprint/backlog split _(enforced)_
- ADR-006: Depends Graph Validation in DriftChecker Domain Service _(enforced)_

**Guidelines:**
- core.md
- documentation.md

**Failure Patterns:**
- Unstructured IDEAs before TASK-033*(Sprint 3)*: The original TEMPLATE only had `## Proposal` with no structured fields. THINK had to infer gaps without dependency or size context. The first 8 IDEAs were refined with more friction than necessary. _(docs/KAIZEN-LOG.md)_
- Invariant Discovery Gap*(2026-05-12)*: The boundary ambiguity between `arch govern` (deterministic enforcement) and THINK (LLM analysis) was not surfaced by any ARCH mechanism. No DriftChecker rule, no structural check, no semantic scan detected it. A human noticed it during a reflection session. The specific risk: `arch govern` triggers THINK via `runConduct()`, creating naming confusion between enforcement and advisory synthesis — with no written invariant to refuse the rationalization "THINK already participates in govern, so it can also…". **Resolution:** Constitutional split written in IDENTITY.md §7. IDEA-architectural-tension-capture proposed as a new artifact class for structural ambiguities that are not yet broken but will be misused. **The deeper pattern:** ARCH models tasks, decisions, and causal edges, but not category errors or ontological drift. Invariants that live only in the author's head do not scale. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [x] accurate — files and ADRs were on-target
- [x] partial — correct direction, missing key files
- [x] off — wrong files dominated

### Gaps
None — THINK.md Phase 2 is the right target. Drift check fits in DriftChecker.

The current THINK refinement process often produces M/L tasks that require Claude/Gemini, losing the cost efficiency of local Ollama models. By adding a "Local-First Decomposition" heuristic to THINK Phase 2, agents are required to attempt splitting M+ tasks into at least 2-3 XS/S subtasks when the logic is modularizable. An `arch review` warning should surface when too many M/L tasks lack a decomposition justification.

### Acceptance Criteria

- [x] `docs/agents/THINK.md` Phase 2 includes a "Local-First Decomposition" heuristic with explicit criteria for when decomposition is mandatory vs. justified as complex.
- [x] `arch review` warns when READY tasks have M/L size without a documented decomposition rationale.
- [x] `arch review` passes.  →  cmd: arch review; exit: 0

### Definition of Done

- [x] THINK.md updated with Local-First Decomposition heuristic; arch review check implemented.
- [x] `arch review` passes.

## Hansei
**Severity:** H0
**Category:** [SpecDrift]
**Decision:** Local-First Decomposition heuristic added to THINK.md Phase 2 (after step 3). Defines mandatory decomposition criteria vs justified complex single-task criteria. checkDecompositionRationale() added to DriftChecker: ADVISORY on READY M/L tasks without ### Gaps section. 707 tests pass.
**Constraint:** Check is ADVISORY not WARN — does not block review pass. Intentional: Gaps section is a new requirement, existing tasks would all fail WARN.
**Cost:** No architectural debt.
**Forward Action:** Upgrade ADVISORY to WARN after one sprint of adoption (tasks filed after today should all have Gaps sections).
