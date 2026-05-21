## TASK-971: Implement Materialized Reporting Layer (Periodic Status)
**Meta:** P3 | S | DONE | Focus:no | 2-code-generation | local | cli/src/main/ts/domain/services/status-report-service.ts
**Turns:** 0
**Closed-at:** 2026-05-21T08:38:22.087Z
**Actor:** unknown
**Locked-commit:** 4427caeb
**Created-at:** 2026-05-21T08:35:49.642Z

**Depends:** TASK-950

### Context

Status documents (`README.md`, `docs/ROADMAP.md`) are currently manual and drift from reality. Per user directive, these must be treated as a **materialized reporting layer**: strictly derivative, non-authoritative snapshots of system state.

**CRITICAL INVARIANT:** This layer must never be consumed as operational input by any other ARCH component. It is a "one-way mirror" for human consumption only. Automating this after TASK-950 ensures that we are reporting on a hardened epistemological contract rather than generating "apparent consistency" over ambiguous data.


### Relevant Context
_confidence: 0.48_

**Files:**
- cli/src/main/ts/domain/models/task.ts _(core)_
- cli/src/main/ts/domain/services/status-report-service.ts _(core)_
- cli/src/main/ts/domain/models/context-index.ts _(core)_
- cli/src/main/ts/domain/models/action.ts _(core)_
- cli/src/main/ts/domain/models/decision.ts _(core)_

**ADRs:**
- ADR-017: Deterministic Observability & Operational Metrics _(enforced)_
- ADR-016: Define the semantic boundary of the domain layer _(enforced)_
- ADR-026: Epistemic Layer Separation — Event Log, State Projection, Governance Semantics _(enforced)_

**Guidelines:**
- bugs.md
- core.md

**Failure Patterns:**
- Invariant Discovery Gap*(2026-05-12)*: The boundary ambiguity between `arch govern` (deterministic enforcement) and THINK (LLM analysis) was not surfaced by any ARCH mechanism. No DriftChecker rule, no structural check, no semantic scan detected it. A human noticed it during a reflection session. The specific risk: `arch govern` triggers THINK via `runConduct()`, creating naming confusion between enforcement and advisory synthesis — with no written invariant to refuse the rationalization "THINK already participates in govern, so it can also…". **Resolution:** Constitutional split written in IDENTITY.md §7. IDEA-architectural-tension-capture proposed as a new artifact class for structural ambiguities that are not yet broken but will be misused. **The deeper pattern:** ARCH models tasks, decisions, and causal edges, but not category errors or ontological drift. Invariants that live only in the author's head do not scale. _(docs/KAIZEN-LOG.md)_
- Decision Blindness (High Velocity)*(Sprint 3)*: The agent executes architectural changes (ADR) and detects bugs (TASK-061) that stay in logs or PRs without immediate human visibility. High velocity (35 tasks/48h) makes individual monitoring impossible. **Proposal:** GOVERNANCE.md contract + INBOX.md weekly dashboard + `arch inbox` agent. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

### Acceptance Criteria

- [x] `StatusReportService` implemented as a **read-only projection engine** → file: cli/src/main/ts/domain/services/status-report-service.ts
- [x] Output is structurally separated into a **Typed Schema** → file: cli/src/main/ts/domain/services/status-report-service.ts
- [x] Schema strictly adheres to **Allowed Primitives** → prose: verified by architectural review of PrimitiveStatusReport interface
- [x] `arch status --publish` command implemented → cmd: node cli/dist/index.js status --publish; exit: 0
- [x] `arch govern` automatically triggers `--publish` after deterministic ticks → file: cli/src/main/ts/application/use-cases/govern-system.ts

### Definition of Done
- [x] All ACs checked by Auditor → prose: Auditor verifies each AC against repo state
- [x] Tests pass → cmd: npm test --prefix cli; exit: 0
- [x] `arch review` passes → cmd: node cli/dist/index.js review; exit: 0

## Hansei
**Severity:** H0
**Category:** [SpecDrift]
**Decision:** Redefined as a "Materialized Reporting Layer" to prevent documentary feedback loops and protect epistemic integrity.
**Constraint:** No constraints apply as the task has just been initialized.
**Cost:** No cost has been incurred yet for this task execution.
**Forward Action:** Implement StatusReportService as a read-only projection.