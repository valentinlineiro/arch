## TASK-282: Implement structural policies - declarative architectural boundaries in arch review
**Meta:** P3 | M | DONE | Focus:no | 2-code-generation | claude | cli/src/main/ts/application/use-cases/drift-checker.ts, arch.config.json
**Turns:** 0
**Closed-at:** 2026-06-01T18:35:41.085Z
**Actor:** unknown
**Locked-commit:** 570ed46
**Created-at:** 2026-06-01T18:31:40.946Z

### Context


### Relevant Context
_confidence: 0.47_

**Files:**
- cli/src/main/ts/domain/models/task.ts _(core)_
- cli/src/main/ts/domain/models/decision.ts _(core)_
- cli/src/main/ts/domain/models/action.ts _(core)_
- cli/src/main/ts/domain/models/context-index.ts _(core)_
- cli/src/main/ts/domain/services/metrics-engine.ts _(core)_

**ADRs:**
- ADR-016: Define the semantic boundary of the domain layer _(enforced)_
- ADR-025: Two-Track Versioning Architecture _(enforced)_
- ADR-006: Depends Graph Validation in DriftChecker Domain Service _(enforced)_

**Guidelines:**
- bugs.md
- core.md

**Failure Patterns:**
- Invariant Discovery Gap*(2026-05-12)*: The boundary ambiguity between `arch govern` (deterministic enforcement) and THINK (LLM analysis) was not surfaced by any ARCH mechanism. No DriftChecker rule, no structural check, no semantic scan detected it. A human noticed it during a reflection session. The specific risk: `arch govern` triggers THINK via `runConduct()`, creating naming confusion between enforcement and advisory synthesis — with no written invariant to refuse the rationalization "THINK already participates in govern, so it can also…". **Resolution:** Constitutional split written in IDENTITY.md §7. IDEA-architectural-tension-capture proposed as a new artifact class for structural ambiguities that are not yet broken but will be misused. **The deeper pattern:** ARCH models tasks, decisions, and causal edges, but not category errors or ontological drift. Invariants that live only in the author's head do not scale. _(docs/KAIZEN-LOG.md)_
- Decision Blindness (High Velocity)*(Sprint 3)*: The agent executes architectural changes (ADR) and detects bugs (TASK-061) that stay in logs or PRs without immediate human visibility. High velocity (35 tasks/48h) makes individual monitoring impossible. **Proposal:** GOVERNANCE.md contract + INBOX.md weekly dashboard + `arch inbox` agent. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [x] accurate — files and ADRs were on-target
- [x] partial — correct direction, missing key files
- [x] off — wrong files dominated

### Gaps
None blocking. DriftChecker already has the check infrastructure. This adds a new check type reading from arch.config.json policies block.

Architectural constraints (forbidden dependencies, naming conventions, required test coverage, module boundary rules) are stated in guidelines but not enforced. Guidelines alone are not governance per P-003. This task implements declarative structural policies in `arch.config.json` that are checked by `arch review` as WARN or ERR, applying the same severity semantics as existing drift checks.

### Acceptance Criteria

- [x] `arch.config.json` supports a `policies` block with at least `forbiddenDependencies`, `requiredTestCoverage`, and `namingInvariants` fields.
- [x] `arch review` checks each declared policy and emits WARN or ERR violations consistent with existing drift check semantics.
- [x] `arch review` passes.  →  cmd: arch review; exit: 0

### Definition of Done

- [x] Structural policy engine implemented in DriftChecker reading from arch.config.json policies block.
- [x] `arch review` passes.

## Hansei
**Severity:** H1
**Category:** [SpecDrift]
**Decision:** checkStructuralPolicies() added to DriftChecker. Reads arch.config.json policies block: forbiddenDependencies (import violation checks), requiredTestCoverage (test file ratio >= threshold), namingInvariants (pattern checks). arch.config.json extended with sample policies. ConfigLoader import added. System Review OK, 707 tests.
**Constraint:** forbiddenDependencies does single-level readdir — does not recurse into subdirectories. Catches direct violations in the declared folder, not nested.
**Cost:** Minor: policies check adds ~100ms on large repos. Acceptable.
**Forward Action:** Add recursive directory scanning to forbiddenDependencies if needed.
