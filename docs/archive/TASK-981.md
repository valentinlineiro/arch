## TASK-981: Pivot ARCH Audit to structural analysis engine
**Meta:** P3 | M | DONE | Focus:false | 2-code-generation | local | docs/tasks/
**Turns:** 2
**Closed-at:** 2026-05-21T14:35:40.541Z
**Actor:** unknown
**Locked-commit:** 36500311
**Created-at:** 2026-05-21T14:35:08.320Z
**Depends:** none

### Gaps
- Refined subsystem clustering (currently uses directory-seeded import graph, could use more advanced community detection).
- Language-agnostic structural extraction (currently limited to TS/JS imports).
- Detailed temporal risk analysis (integration with Git history for deeper co-change analysis).

### Acceptance Criteria
- [ ] Implementation file exists at declared context path
  - `file: (path)`
- [ ] Tests pass
  - `cmd: npm test; exit: 0`
- [ ] `arch review` passes
  - `cmd: node cli/dist/index.js review`

### Context


### Relevant Context
_confidence: 0.46_

**Files:**
- docs/INBOX.md _(utility)_
- cli/src/main/ts/domain/models/audit-inference.ts _(core)_
- cli/src/main/ts/domain/models/traceability-graph.ts _(core)_
- .arch/focus-ledger.jsonl _(utility)_
- cli/src/main/ts/domain/models/task.ts _(core)_

**ADRs:**
- ADR-013: Two-Tier Drift Detection Architecture _(enforced)_
- ADR-003: DISPATCH output is ephemeral — exception to ADR-001 _(enforced)_
- ADR-016: Define the semantic boundary of the domain layer _(enforced)_

**Guidelines:**
- bugs.md
- core.md

**Failure Patterns:**
- Invariant Discovery Gap*(2026-05-12)*: The boundary ambiguity between `arch govern` (deterministic enforcement) and THINK (LLM analysis) was not surfaced by any ARCH mechanism. No DriftChecker rule, no structural check, no semantic scan detected it. A human noticed it during a reflection session. The specific risk: `arch govern` triggers THINK via `runConduct()`, creating naming confusion between enforcement and advisory synthesis — with no written invariant to refuse the rationalization "THINK already participates in govern, so it can also…". **Resolution:** Constitutional split written in IDENTITY.md §7. IDEA-architectural-tension-capture proposed as a new artifact class for structural ambiguities that are not yet broken but will be misused. **The deeper pattern:** ARCH models tasks, decisions, and causal edges, but not category errors or ontological drift. Invariants that live only in the author's head do not scale. _(docs/KAIZEN-LOG.md)_
- Sprint vs backlog as structural duplication*(Sprint 3)*: Saying "move everything to sprint" left the backlog empty — evidence the separation was artificial. TASK-047 was promoted to resolve this with a single-directory model + Focus field. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

#### Intent
Pivot ARCH Audit to structural analysis engine

### Definition of Done
- [ ] All ACs checked by Auditor
- [ ] `arch review` passes

## Hansei
**Severity:** H0
**Category:** [SpecDrift]
**Decision:** Pivoted ARCH Audit from governance-alignment to structural analysis as per Product Spec v1.0.
**Constraint:** Structural and behavioral signals only; no authoritative truth claims allowed.
**Cost:** Minimal implementation overhead; leveraged existing NodeFileSystem and Git components.
**Forward Action:** None required; feature is feature-complete for MVP scope.