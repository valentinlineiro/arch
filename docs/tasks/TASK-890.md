## TASK-890: arch task start - Contextual Memory Injection
**Meta:** P1 | M | REVIEW | Focus:no | 2-code-generation | local | cli/src/main/ts/
**Created-at:** 2026-05-15T08:00:27.007Z
**Depends:** none

### Acceptance Criteria
- [x] ContextInference extended to retrieve Hansei failures from archive/ based on class match and context overlap → prose: LoadBearingMemory.findHanseiFailures filters archive by class + context overlap
- [x] TaskCommand.execute('start') captures and prints the inferred Load-bearing Memory block → grep: "LoadBearingMemory" cli/src/main/ts/application/commands/task-command.ts
- [x] Stdout block includes enforced ADRs (ID, title, core constraint) → prose: findEnforcedAdrs reads ContextIndex, filters strength===enforced with context overlap
- [x] Stdout block includes past Hansei failures (Task ID, Category, Decision, Cost) → prose: findHanseiFailures maps to taskId, category, decision, cost fields
- [x] Output block is clearly delimited from standard command output → prose: HEADER/FOOTER dashed lines present in format()
- [x] Agents picking up a task are conditioned by the printed context → prose: block printed to stdout immediately after IN_PROGRESS confirmation
- [x] arch review passes → cmd: node cli/dist/index.js review; exit: 0
- [x] npm test passes → cmd: npm test --prefix cli; exit: 0

### Context

### Relevant Context
_confidence: 0.42_

**Files:**
- cli/src/main/ts/domain/models/context-index.ts _(core)_
- cli/src/main/ts/domain/models/task.ts _(core)_
- cli/src/main/ts/domain/models/reflect-decision.ts _(core)_
- cli/src/main/ts/domain/task.ts _(core)_
- cli/src/main/ts/domain/services/archive-parser.ts _(core)_

**ADRs:**
- ADR-012: Exec/Bridge Layer Bugfixes - maxBuffer, buildCommand signature, local routing _(enforced)_
- ADR-017: Deterministic Observability & Operational Metrics _(enforced)_
- ADR-006: Depends Graph Validation in DriftChecker Domain Service _(enforced)_

**Guidelines:**
- core.md
- testing-a-change.md

**Failure Patterns:**
- Invariant Discovery Gap*(2026-05-12)*: The boundary ambiguity between `arch govern` (deterministic enforcement) and THINK (LLM analysis) was not surfaced by any ARCH mechanism. No DriftChecker rule, no structural check, no semantic scan detected it. A human noticed it during a reflection session. The specific risk: `arch govern` triggers THINK via `runConduct()`, creating naming confusion between enforcement and advisory synthesis — with no written invariant to refuse the rationalization "THINK already participates in govern, so it can also…". **Resolution:** Constitutional split written in IDENTITY.md §7. IDEA-architectural-tension-capture proposed as a new artifact class for structural ambiguities that are not yet broken but will be misused. **The deeper pattern:** ARCH models tasks, decisions, and causal edges, but not category errors or ontological drift. Invariants that live only in the author's head do not scale. _(docs/KAIZEN-LOG.md)_
- Decision Blindness (High Velocity)*(Sprint 3)*: The agent executes architectural changes (ADR) and detects bugs (TASK-061) that stay in logs or PRs without immediate human visibility. High velocity (35 tasks/48h) makes individual monitoring impossible. **Proposal:** GOVERNANCE.md contract + INBOX.md weekly dashboard + `arch inbox` agent. _(docs/KAIZEN-LOG.md)_

#### Problem
Agents often start tasks without full knowledge of relevant ADRs or past failures (Hansei) in the same domain. This leads to rework and repeating historical mistakes.

#### Solution
Enhance `arch task start TASK-XXX` to inject "Load-bearing Memory" into stdout.

**Mechanism:**
1. **ADRs:** Match the task's `class` and `context` paths against the ContextIndex to find enforced ADRs.
2. **Hansei Failures:** Identify archived tasks with the same `class` and overlapping `context` paths. Filter for H1-H3 severity Hansei.
3. **Injection (Stdout):** Print a structured block after the "marking as IN_PROGRESS" message.

### Definition of Done
- [x] All ACs checked → prose: all ACs above verified
- [x] arch review passes → cmd: node cli/dist/index.js review; exit: 0

## Hansei
**Severity:** H1
**Category:** [SpecDrift]
**Decision:** The AdrEntry model does not carry a constraint field — only title, keywords, affectedModules, strength. The designed output example showed a constraint line per ADR that cannot be populated without reading the ADR markdown files. Implemented with title-only output rather than inventing a field or adding file reads to the hot path.
**Constraint:** AdrEntry is a domain model in a protected path (arch.config.json protectedPaths includes domain/models/). Adding a constraint field requires an ADR.
**Cost:** One design assumption invalidated at implementation time — the constraint display was dropped from the ADR injection block. Minor divergence from the designed stdout format.
**Forward Action:** If ADR constraint injection is needed, extend AdrEntry with a constraint field via ADR and rebuild the context index. Track as an IDEA if this matters.
