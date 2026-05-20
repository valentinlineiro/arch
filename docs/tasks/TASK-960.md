## TASK-960: Produce sprint state machine design document: define SprintS
**Meta:** P1 | S | IN_PROGRESS | Focus:yes | 6-writing | local | docs/tasks/
**Actor:** unknown
**Created-at:** 2026-05-19T14:46:56.222Z
**Depends:** none

### Acceptance Criteria
- [ ] Document exists at declared path
  - `file: (path)`
- [ ] Content is accurate and complete
  - `prose: reviewed and verified`
- [ ] `arch review` passes
  - `cmd: node cli/dist/index.js review`

### Context

### Relevant Context
_confidence: 0.49_

**Files:**
- cli/src/main/ts/application/use-cases/focus-ledger.ts _(domain)_
- cli/src/main/ts/domain/services/config-loader.ts _(core)_
- cli/src/main/ts/application/use-cases/deep-analysis-state.ts _(domain)_
- cli/src/main/ts/application/use-cases/correction-signal-store.ts _(domain)_
- cli/src/main/ts/domain/repositories/file-system.ts _(core)_

**ADRs:**
- ADR-015: Causal Signal Arbitration Layer _(enforced)_
- ADR-016: Define the semantic boundary of the domain layer _(enforced)_
- ADR-004: Flat docs/tasks/ directory with Focus field replaces sprint/backlog split _(enforced)_

**Guidelines:**
- core.md
- documentation.md

**Failure Patterns:**
- Invariant Discovery Gap*(2026-05-12)*: The boundary ambiguity between `arch govern` (deterministic enforcement) and THINK (LLM analysis) was not surfaced by any ARCH mechanism. No DriftChecker rule, no structural check, no semantic scan detected it. A human noticed it during a reflection session. The specific risk: `arch govern` triggers THINK via `runConduct()`, creating naming confusion between enforcement and advisory synthesis — with no written invariant to refuse the rationalization "THINK already participates in govern, so it can also…". **Resolution:** Constitutional split written in IDENTITY.md §7. IDEA-architectural-tension-capture proposed as a new artifact class for structural ambiguities that are not yet broken but will be misused. **The deeper pattern:** ARCH models tasks, decisions, and causal edges, but not category errors or ontological drift. Invariants that live only in the author's head do not scale. _(docs/KAIZEN-LOG.md)_
- Batch lock commit fails TASK-ID validator*(Sprint 3)*: Locking 4 tasks in a `[SPRINT]` commit caused `arch review` to report a format violation. The validator assumes a single TASK-ID per commit — batch planning commits are an uncovered edge case. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

#### Intent
Produce sprint state machine design document: define SprintState model (ACTIVE/CLOSED/NEXT_PENDING) with valid transitions and per-state invariants, declare single source of truth (ledger vs config arbitration rule), define arch govern authority boundary (what it reads/writes/never touches on sprint path), prove idempotency as a property of the state machine. Output is design doc only — no code. Unblocks TASK-957.

### Definition of Done
- [ ] All ACs checked by Auditor
- [ ] `arch review` passes