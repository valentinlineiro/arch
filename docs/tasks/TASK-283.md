## TASK-283: Define Sentinel call log infrastructure and CLI command
**Meta:** P2 | M | DONE | Focus:no | 2-code-generation | claude | cli/src/main/ts/, docs/agents/DO.md
**Closed-at:** 2026-05-19T13:29:06Z
**Actor:** unknown
**Locked-commit:** 644e1330
**Created-at:** 2026-05-19T13:02:55.789Z

### Context

DO.md mandates Sentinel preflight reasoning calls for high-cost or high-risk operations, but there is no structured log of these calls and `arch review` cannot verify they occurred. This task defines the Sentinel call log format, implements `arch sentinel log` CLI command, and adds a `SentinelCoverage` drift check for IN_PROGRESS tasks above a cost threshold.


### Relevant Context
_confidence: 0.43_

**Files:**
- cli/src/main/ts/domain/models/context-index.ts _(core)_
- cli/src/main/ts/domain/models/task.ts _(core)_
- cli/src/main/ts/domain/models/reflect-decision.ts _(core)_
- docs/tasks/TASK-279.md _(utility)_
- docs/tasks/TASK-280.md _(utility)_

**ADRs:**
- ADR-017: Deterministic Observability & Operational Metrics _(enforced)_
- ADR-024: Drift Coverage Identity Model _(enforced)_
- ADR-014: Causal Graph Schema for Chronicle _(enforced)_

**Guidelines:**
- testing-a-change.md
- versioning.md

**Failure Patterns:**
- Invariant Discovery Gap*(2026-05-12)*: The boundary ambiguity between `arch govern` (deterministic enforcement) and THINK (LLM analysis) was not surfaced by any ARCH mechanism. No DriftChecker rule, no structural check, no semantic scan detected it. A human noticed it during a reflection session. The specific risk: `arch govern` triggers THINK via `runConduct()`, creating naming confusion between enforcement and advisory synthesis — with no written invariant to refuse the rationalization "THINK already participates in govern, so it can also…". **Resolution:** Constitutional split written in IDENTITY.md §7. IDEA-architectural-tension-capture proposed as a new artifact class for structural ambiguities that are not yet broken but will be misused. **The deeper pattern:** ARCH models tasks, decisions, and causal edges, but not category errors or ontological drift. Invariants that live only in the author's head do not scale. _(docs/KAIZEN-LOG.md)_
- Unstructured IDEAs before TASK-033*(Sprint 3)*: The original TEMPLATE only had `## Proposal` with no structured fields. THINK had to infer gaps without dependency or size context. The first 8 IDEAs were refined with more friction than necessary. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

### Gaps

- **Cost threshold config**: `SentinelCoverage` needs a threshold — propose using task size (M/L/XL trigger Sentinel requirement). Configurable via `arch.config.json` `sentinelSizeThreshold` field, defaulting to `M`.
- **SENTINEL-LOG.md format**: Needs fields: timestamp, taskId, trigger reason, outcome (GO|HALT), and optional note. Append-only, one entry per invocation.
- **IN_PROGRESS scope**: The drift check must read current IN_PROGRESS tasks and verify log entries exist. Risk: IN_PROGRESS tasks started before this feature is deployed will generate false WARNs. Propose: only check tasks whose `Locked-commit` postdates the feature commit.

### Acceptance Criteria

- [x] `docs/SENTINEL-LOG.md` format is defined and `arch sentinel log TASK-XXX --trigger "<reason>" --outcome GO|HALT` appends validated entries.
- [x] A `SentinelCoverage` drift check in `arch review` verifies at least one SENTINEL-LOG entry exists for IN_PROGRESS tasks above the configured cost threshold.
- [x] `arch review` passes.  →  cmd: arch review; exit: 0

### Definition of Done

- [x] Sentinel log infrastructure, CLI command, and drift check implemented.
- [x] `arch review` passes.

## Approval
Approved-by: Auditor | 2026-05-19

## Hansei
**Severity:** H2
**Category:** [SpecDrift]
**Decision:** The `SentinelCoverage` check uses task size (M/L/XL) as the cost proxy because that is the only durable, structured field available at review time without requiring DO.md protocol adherence to be tracked separately. The check is advisory (WARN not FAIL) — making it a gate would block legitimate IN_PROGRESS tasks that started before this feature was deployed, since they have no retroactive sentinel entries.
**Constraint:** Size as cost proxy is imperfect. A well-scoped M task may have lower risk than a poorly-scoped S task. The check catches the structural case (large tasks should have explicit preflight reasoning) but cannot enforce the quality of the reasoning recorded. A HALT entry is structurally equivalent to a GO entry from the check's perspective — the human must read the log to judge.
**Cost:** One M session. Implementation is straightforward; the sentinel log is a markdown file rather than a jsonl to keep it human-readable and auditable without tooling.
**Forward Action:** See IDEA-corpus-informed-reprioritization for patterns on advisory-layer design. After 60 days, audit whether Sentinel entries show a non-trivial HALT rate. If HALT rate is > 10%, the check is surfacing real preflight decisions. If it is < 1%, the log is ceremonial and the check's threshold should be tightened to L/XL only.
