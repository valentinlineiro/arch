## TASK-891: arch task create - Instant Task Scaffolding
**Meta:** P1 | M | IN_PROGRESS | Focus:no | 2-code-generation | local | cli/src/main/ts/
**Created-at:** 2026-05-15T08:10:19.685Z
**Depends:** none

### Acceptance Criteria
- [x] arch task create "<intent>" subcommand scaffolds a task file → grep: "subCommand === 'create'" cli/src/main/ts/application/commands/task-command.ts
- [x] LLM drafting attempted for title, ACs, size, and class based on the intent string → prose: verified — arch task create ran with claude provider and produced TASK-892 with LLM-drafted title and ACs
- [x] Fallback to skeleton when LLM is unavailable — tryLlmDraft catches all errors and returns null → grep: "return null" cli/src/main/ts/application/use-cases/create-task.ts
- [x] ContextInference runs and injects relevant context into the scaffolded task file → grep: "ContextInference" cli/src/main/ts/application/use-cases/create-task.ts
- [x] Generated task file passes arch lint before being written to disk → prose: TaskValidator.validateMeta called before write; invalid meta falls back to safe defaults
- [x] New task is committed automatically → prose: verified via git log — chore: [TASK-892] scaffold task from intent commit present
- [x] arch review passes → cmd: node cli/dist/index.js review; exit: 0
- [x] npm test passes → cmd: npm test --prefix cli; exit: 0

### Context

### Relevant Context
_confidence: 0.43_

**Files:**
- cli/src/main/ts/domain/models/task.ts _(core)_
- cli/src/main/ts/domain/models/context-index.ts _(core)_
- cli/src/main/ts/domain/task.ts _(core)_
- cli/src/main/ts/domain/models/reflect-decision.ts _(core)_
- docs/TASK-FORMAT.md _(utility)_

**ADRs:**
- ADR-012: Exec/Bridge Layer Bugfixes - maxBuffer, buildCommand signature, local routing _(enforced)_
- ADR-017: Deterministic Observability & Operational Metrics _(enforced)_
- ADR-001: Use git as the primary state engine _(enforced)_

**Guidelines:**
- testing-a-change.md
- versioning.md

**Failure Patterns:**
- Invariant Discovery Gap*(2026-05-12)*: The boundary ambiguity between `arch govern` (deterministic enforcement) and THINK (LLM analysis) was not surfaced by any ARCH mechanism. No DriftChecker rule, no structural check, no semantic scan detected it. A human noticed it during a reflection session. The specific risk: `arch govern` triggers THINK via `runConduct()`, creating naming confusion between enforcement and advisory synthesis — with no written invariant to refuse the rationalization "THINK already participates in govern, so it can also…". **Resolution:** Constitutional split written in IDENTITY.md §7. IDEA-architectural-tension-capture proposed as a new artifact class for structural ambiguities that are not yet broken but will be misused. **The deeper pattern:** ARCH models tasks, decisions, and causal edges, but not category errors or ontological drift. Invariants that live only in the author's head do not scale. _(docs/KAIZEN-LOG.md)_
- Decision Blindness (High Velocity)*(Sprint 3)*: The agent executes architectural changes (ADR) and detects bugs (TASK-061) that stay in logs or PRs without immediate human visibility. High velocity (35 tasks/48h) makes individual monitoring impossible. **Proposal:** GOVERNANCE.md contract + INBOX.md weekly dashboard + `arch inbox` agent. _(docs/KAIZEN-LOG.md)_

#### Problem
Creating a new task requires manually creating a file, copying a template, and filling in metadata. This "creation friction" leads to users doing work that isn't tracked or postponing task decomposition.

#### Solution
Implement `arch task create "<intent>"` to scaffold a task file instantly.

**Behavior:**
1. **Drafting:** The CLI uses an LLM (in a non-enforcement role) to draft ACs, Size, and Class from the intent string.
2. **Fallback:** If no LLM is configured or available, fall back to a skeleton task (empty ACs, size S, class 2-code-generation) without failing.
3. **Context Inference:** Run ContextInference to inject relevant files/ADRs into the task.
4. **File Creation:** Creates `docs/tasks/TASK-XXX.md` with status READY.
5. **Validation:** The generated meta line must pass TaskValidator before the file is written.

### Definition of Done
- [x] All ACs checked → prose: all ACs above verified
- [x] arch review passes → cmd: node cli/dist/index.js review; exit: 0

## Hansei
**Severity:** H1
**Category:** [SpecDrift]
**Decision:** The LLM returned title strings wrapped in double-quotes (e.g., "Glossary Command Addition") that propagated into the task header. The IDEA spec did not specify quote stripping. Fixed inline with a regex strip on the parsed title, adding one correction turn after smoke testing.
**Constraint:** LLM output is free-form text; any field parsed from it must be sanitized before use in structured markdown. The parseDraft method now strips leading/trailing quotes and non-ASCII characters from the title.
**Cost:** One extra turn to identify and fix the quote propagation bug during smoke testing. No rework of architecture required.
**Forward Action:** If LLM output quality issues recur, consider a more constrained output format (JSON) instead of line-by-line parsing. Track as an IDEA if the prose parser proves fragile.
