## TASK-268: Align phase naming between ADR-013 and THINK.md
**Meta:** P1 | XS | DONE | Focus:no | 6-writing | claude | docs/adr/ADR-013-two-tier-drift-detection.md, docs/agents/THINK.md
**Turns:** 0
**Closed-at:** 2026-05-19T12:49:43.829Z
**Actor:** unknown
**Locked-commit:** bb1cd4d4
**Created-at:** 2026-05-19T12:49:25.855Z

### Context

ADR-013 references "THINK Phase 3.5" for semantic drift analysis, but `docs/agents/THINK.md` implements this as "Phase 2.5". This discrepancy creates confusion about the protocol's structure and makes ADR-013 appear outdated. The terminology must be aligned so both documents reference the same phase name.


### Relevant Context
_confidence: 0.44_

**Files:**
- cli/src/main/ts/domain/models/context-index.ts _(core)_
- cli/src/main/ts/domain/models/task.ts _(core)_
- cli/src/main/ts/domain/services/reviewer.ts _(core)_
- cli/src/main/ts/application/use-cases/drift-checker.ts _(domain)_
- .arch/focus-ledger.jsonl _(utility)_

**ADRs:**
- ADR-013: Two-Tier Drift Detection Architecture _(enforced)_
- ADR-004: Flat docs/tasks/ directory with Focus field replaces sprint/backlog split _(enforced)_
- ADR-008: Centralize halt conditions in HALT.md _(enforced)_

**Guidelines:**
- core.md
- documentation.md

**Failure Patterns:**
- Invariant Discovery Gap*(2026-05-12)*: The boundary ambiguity between `arch govern` (deterministic enforcement) and THINK (LLM analysis) was not surfaced by any ARCH mechanism. No DriftChecker rule, no structural check, no semantic scan detected it. A human noticed it during a reflection session. The specific risk: `arch govern` triggers THINK via `runConduct()`, creating naming confusion between enforcement and advisory synthesis — with no written invariant to refuse the rationalization "THINK already participates in govern, so it can also…". **Resolution:** Constitutional split written in IDENTITY.md §7. IDEA-architectural-tension-capture proposed as a new artifact class for structural ambiguities that are not yet broken but will be misused. **The deeper pattern:** ARCH models tasks, decisions, and causal edges, but not category errors or ontological drift. Invariants that live only in the author's head do not scale. _(docs/KAIZEN-LOG.md)_
- Missing Mura Signals*(Sprint v0.6.0-final)*: Although TASK-182 introduced the `Turns: N` metadata field, agents are not consistently recording this field at task completion. This creates a data gap for THINK Phase 4 (Mura detection). **Proposal:** Automate turn-count recording in the `arch task done` command or within the EXEC loop logic to remove reliance on agent judgment. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

### Gaps

Both ADR-013 and THINK.md already reference "Phase 2.5 (Semantic Drift Analysis)" — TASK-231 fixed this. No changes needed.

### Acceptance Criteria

- [x] ADR-013 and THINK.md reference the same phase name for the semantic drift analysis phase (either "Phase 2.5" or "Phase 3.5" — one document is updated to match the other).
- [x] `arch review` passes.  →  cmd: arch review; exit: 0

### Definition of Done

- [x] Phase naming consistent across ADR-013 and THINK.md.

## Hansei
**Severity:** H2
**Category:** [SpecDrift]
**Decision:** Alignment was already complete before this task was picked up. TASK-231 ("Fix stale Phase 3.5 reference in ADR-013") resolved the exact discrepancy this task describes. Both ADR-013 and THINK.md reference "Phase 2.5 (Semantic Drift Analysis)". No code or docs written this session — only verification.
**Constraint:** The IDEA archive (`IDEA-fix-phase-naming-drift.md`, `IDEA-adr-013-phase-label-drift.md`) and old superpowers specs still contain "Phase 3.5" references, but these are historical artifacts — they describe the state at authoring time and don't need updating.
**Cost:** Zero. One session turn to verify current state.
**Forward Action:** IDEA-verify-pre-existing-before-start — third recurrence this session (TASK-279, TASK-260, TASK-268). Agents should grep for the error condition before treating a task as unimplemented. The pattern: task is created to fix X; X is fixed by a side effect of another task; the original task sits in READY until picked up, then closes immediately as already-done.
- [ ] `arch review` passes.
