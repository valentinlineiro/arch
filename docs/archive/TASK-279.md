## TASK-279: Implement arch ask - memory queries over the full ARCH operational corpus
**Meta:** P1 | M | DONE | Focus:no | 2-code-generation | claude | cli/src/main/ts/
**Turns:** 1
**Closed-at:** 2026-05-19T12:02:23.796Z
**Actor:** unknown
**Locked-commit:** ee9dee2b
**Created-at:** 2026-05-19T12:01:26.213Z

### Context

ARCH accumulates operational memory across hundreds of tasks, retros, ADRs, and guidelines, but this memory is not queryable. Agents repeat work already done and miss relevant prior decisions. `arch ask "<question>"` will analyze the full corpus and return causal patterns, recurring failure signatures, and actionable recommendations, powered by the ContextIndex from TASK-219.


### Relevant Context
_confidence: 0.43_

**Files:**
- cli/src/main/ts/domain/models/context-index.ts _(core)_
- cli/src/main/ts/domain/models/task.ts _(core)_
- docs/tasks/TASK-279.md _(utility)_
- docs/tasks/TASK-280.md _(utility)_
- docs/tasks/TASK-281.md _(utility)_

**ADRs:**
- ADR-017: Deterministic Observability & Operational Metrics _(enforced)_
- ADR-014: Causal Graph Schema for Chronicle _(enforced)_
- ADR-023: Deterministic Gate Invariant _(enforced)_

**Guidelines:**
- testing-a-change.md
- versioning.md

**Failure Patterns:**
- Invariant Discovery Gap*(2026-05-12)*: The boundary ambiguity between `arch govern` (deterministic enforcement) and THINK (LLM analysis) was not surfaced by any ARCH mechanism. No DriftChecker rule, no structural check, no semantic scan detected it. A human noticed it during a reflection session. The specific risk: `arch govern` triggers THINK via `runConduct()`, creating naming confusion between enforcement and advisory synthesis — with no written invariant to refuse the rationalization "THINK already participates in govern, so it can also…". **Resolution:** Constitutional split written in IDENTITY.md §7. IDEA-architectural-tension-capture proposed as a new artifact class for structural ambiguities that are not yet broken but will be misused. **The deeper pattern:** ARCH models tasks, decisions, and causal edges, but not category errors or ontological drift. Invariants that live only in the author's head do not scale. _(docs/KAIZEN-LOG.md)_
- Recursive review violation tasks*(Sprint 4)*: TASK-112, 113, and 114 show a pattern where a task is created to fix a review violation, but then marked DONE with its own violations (e.g. pending ACs), leading to a chain of cleanup tasks. **Proposal:** Implement pre-archive guards (TASK-115) and enforce AC validation during `arch review`. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

### Gaps

Implementation already complete as of TASK-942 era. `arch ask` command exists in `cli/src/main/ts/application/commands/ask-command.ts` and `ask-corpus.ts`. This task is being closed by verifying the existing implementation against ACs.

### Acceptance Criteria

- [x] `arch ask "<question>"` queries the ARCH corpus and returns relevant patterns, related tasks/ADRs, and a suggested action.  →  cmd: arch ask "what causes repeated review failures"; exit: 0
- [x] The command requires no external API key and works locally.
- [x] `arch review` passes.  →  cmd: arch review; exit: 0

### Definition of Done

- [x] `arch ask` command implemented and functional against the local corpus (pre-existing in ask-command.ts + ask-corpus.ts).
- [x] `arch review` passes.

## Hansei
**Severity:** H0
**Category:** [SpecDrift]

**Decision:**
Implementation was fully complete before this task was picked up — `arch ask` existed in `ask-command.ts` + `ask-corpus.ts` from the TASK-942 era. The task was promoted and picked up as if it were unimplemented. The actual work this session was verification: confirmed corpus matches, related task/ADR refs, and no-API-key operation. No code written.

**Constraint:**
The task had placeholder Hansei that said "real Hansei to be written at REVIEW time." This is a pre-completion Hansei that was never updated. The convention of seeding Hansei at promotion time reduces commit friction but creates a gap when a task is closed without review — placeholder text can survive to archive.

**Cost:**
Zero implementation cost. One session turn to verify ACs against pre-existing code.

**Forward Action:**
IDEA-verify-pre-existing-before-start — agents should grep for command/function presence before treating a task as unimplemented. Recurring pattern (also TASK-259, TASK-260 this session): task is created describing work that was done as a side effect of a prior task.

## Approval
Approved-by: Auditor | 2026-05-19
