## TASK-964: Implement arch task hansei TASK-XXX interactive wizard: read
**Meta:** P2 | M | REVIEW | Focus:yes | 2-code-generation | local | cli/src/main/ts/
**Locked-commit:** 035724f3
**Depends:** none

### Gaps

None — `HanseiWizard` class already exists at `cli/src/main/ts/application/use-cases/hansei-wizard.ts` with interactive prompting and `format()`. Missing: CLI routing (`arch task hansei TASK-XXX` subcommand), file write-back (`replaceHanseiBlock`), and H2/H3b Forward Action validation. All three are bounded by ACs below.

### Acceptance Criteria
- [x] `arch task hansei TASK-XXX` subcommand is registered and routes to `HanseiWizard`.  →  file: cli/src/main/ts/application/commands/task-command.ts (hansei branch)
- [x] `replaceHanseiBlock(content, block)` replaces an existing `## Hansei` section or appends one if absent.  →  cmd: node --import tsx --test src/test/ts/hansei-wizard.test.ts; exit: 0
- [x] H2 Forward Action validation rejects input that does not reference an IDEA or TASK link.  →  cmd: node --import tsx --test src/test/ts/hansei-wizard.test.ts; exit: 0
- [x] In non-TTY context, the subcommand exits 1 when `HanseiWizard.isHanseiComplete()` returns false.  →  cmd: node --import tsx --test src/test/ts/hansei-wizard.test.ts; exit: 0
- [x] `arch review` passes.  →  cmd: arch review; exit: 0

### Context

### Relevant Context
_confidence: 0.49_

**Files:**
- cli/src/main/ts/domain/models/context-index.ts _(core)_
- cli/src/main/ts/domain/models/task.ts _(core)_
- cli/src/main/ts/domain/task.ts _(core)_
- cli/src/main/ts/domain/services/deterministic-hansei-checker.ts _(core)_
- cli/src/main/ts/application/use-cases/hansei-wizard.ts _(domain)_

**ADRs:**
- ADR-007: Census Context Budget Check in DriftChecker _(enforced)_
- ADR-017: Deterministic Observability & Operational Metrics _(enforced)_
- ADR-023: Deterministic Gate Invariant _(enforced)_

**Guidelines:**
- testing-a-change.md
- versioning.md

**Failure Patterns:**
- Recursive review violation tasks*(Sprint 4)*: TASK-112, 113, and 114 show a pattern where a task is created to fix a review violation, but then marked DONE with its own violations (e.g. pending ACs), leading to a chain of cleanup tasks. **Proposal:** Implement pre-archive guards (TASK-115) and enforce AC validation during `arch review`. _(docs/KAIZEN-LOG.md)_
- `arch review` does not validate ACs before archiving*(Sprint 3)*: TASK-031 was archived as DONE but with unchecked ACs. The reviewer detected the inconsistency but did not block archival at the time. Detection arrived late (next session). *(Resolved by TASK-078)* _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

#### Intent
Implement arch task hansei TASK-XXX interactive wizard: reads task diff and AC outcomes to pre-fill context, prompts for each required Hansei field in sequence with controlled vocabulary visible, validates each field inline (length >=10 chars, no vague phrases, H2/H3b link requirements), assembles and appends ## Hansei block, runs arch review to confirm before exit.

### Definition of Done
- [x] All ACs checked by Auditor
- [x] `arch review` passes

## Hansei
**Severity:** H1
**Category:** [SpecDrift]
**Decision:** Task ACs were placeholder stubs at READY time — `file: (path)` and `cmd: npm test` without specifics. Rewrote ACs to name exact predicates before implementing. No scope gap, but spec was underspecified at intake.
**Constraint:** TASK-964 was promoted before the AC template was filled in with real paths. The HanseiWizard class existed but the subcommand wiring and file write-back were undocumented in the task.
**Cost:** Two extra commits (AC rewrite + IN_PROGRESS transition) before implementation could start. Minor overhead, fully bounded.
**Forward Action:** None required — pattern is already caught by the AC rewrite step. Consider adding AC specificity check to the `arch task capture` template for M+ tasks.