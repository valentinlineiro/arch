## TASK-963: Refactor DriftChecker.checkExcisionStructure Gate 2 to verif
**Meta:** P1 | S | IN_PROGRESS | Focus:yes | 2-code-generation | local | docs/tasks/
**Locked-commit:** 240e42fd
**Actor:** unknown
**Created-at:** 2026-05-19T14:47:05.732Z
**Depends:** none

### Acceptance Criteria
- [x] Gate 2 logic in `runExcisionGates` checks artifact name presence only, REJECT keyword removed  →  file: cli/src/main/ts/application/use-cases/drift-checker.ts
- [x] Gate 2 passes when decision record references artifact without REJECT (1 new unit test)  →  cmd: npm --prefix cli test; exit: 0
- [x] `arch review` passes  →  cmd: node cli/dist/index.js review; exit: 0

### Context


### Relevant Context
_confidence: 0.46_

**Files:**
- .arch/focus-ledger.jsonl _(utility)_
- docs/INBOX.md _(utility)_
- docs/EVENTS.md _(utility)_
- .arch/chronicle.jsonl _(utility)_
- .arch/reflect-breach-log.jsonl _(utility)_

**ADRs:**
- ADR-006: Depends Graph Validation in DriftChecker Domain Service _(enforced)_
- ADR-008: Centralize halt conditions in HALT.md _(enforced)_
- ADR-013: Two-Tier Drift Detection Architecture _(enforced)_

**Guidelines:**
- testing-a-change.md
- versioning.md

**Failure Patterns:**
- Invariant Discovery Gap*(2026-05-12)*: The boundary ambiguity between `arch govern` (deterministic enforcement) and THINK (LLM analysis) was not surfaced by any ARCH mechanism. No DriftChecker rule, no structural check, no semantic scan detected it. A human noticed it during a reflection session. The specific risk: `arch govern` triggers THINK via `runConduct()`, creating naming confusion between enforcement and advisory synthesis — with no written invariant to refuse the rationalization "THINK already participates in govern, so it can also…". **Resolution:** Constitutional split written in IDENTITY.md §7. IDEA-architectural-tension-capture proposed as a new artifact class for structural ambiguities that are not yet broken but will be misused. **The deeper pattern:** ARCH models tasks, decisions, and causal edges, but not category errors or ontological drift. Invariants that live only in the author's head do not scale. _(docs/KAIZEN-LOG.md)_
- `arch --version` does not exist as a subcommand*(Sprint 3)*: The drift checker compares versions by reading package.json directly because the CLI does not implement `--version`. This is a functional workaround but inconsistent with standard CLI conventions. *(Resolved by TASK-072)* _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

#### Intent
Refactor DriftChecker.checkExcisionStructure Gate 2 to verify presence of decision record only, not content. Remove check for REJECT string — presence closes the Class I gate regardless of artifact content. Semantic validation of excision rationale is Class II and belongs in THINK.

### Definition of Done
- [x] All ACs checked by Auditor  →  prose: verified
- [x] `arch review` passes  →  cmd: node cli/dist/index.js review; exit: 0

## Hansei
**Severity:** H0
**Category:** [ReviewBlindspot]
**Decision:** Gate 2 had two divergent branches: one for IDEA archive files (requiring REJECT in Decision section) and one for ADR files (any mention). The asymmetry was inconsistent with the stated invariant — Class I gates verify structural presence, not content. Collapsed to a single check: does any decision record file mention the artifact? TDD isolated this as a one-condition removal.
**Constraint:** None — the two-branch logic had no downstream dependents enforcing the REJECT requirement.
**Cost:** None — 566 tests pass, one new regression guard added.
**Forward Action:** None required.