## TASK-265: Add ExcisionStructuralCheck to DriftChecker for deletion traceability
**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | claude | cli/src/main/ts/application/use-cases/drift-checker.ts
**Turns:** 1
**Closed-at:** 2026-05-19T11:45:04.395Z
**Actor:** unknown
**Locked-commit:** c2be8161
**Created-at:** 2026-05-19T11:40:54.399Z

### Context

EscalationMaturity currently treats protected-path deletions the same as additions, requiring an ADR even for well-traced removals. This creates selection pressure toward accumulation. An `ExcisionStructuralCheck` with three gates (reference-clean, decision-record exists, build-clean) allows legitimate excisions to pass without an ADR while catching structurally incomplete removals.


### Relevant Context
_confidence: 0.44_

**Files:**
- cli/src/main/ts/application/use-cases/drift-checker.ts _(domain)_
- cli/src/main/ts/domain/models/reflect-decision.ts _(core)_
- cli/src/main/ts/application/use-cases/escalation-store.ts _(domain)_
- cli/src/main/ts/domain/services/deterministic-hansei-checker.ts _(core)_
- cli/src/main/ts/application/use-cases/context-inference.ts _(domain)_

**ADRs:**
- ADR-016: Define the semantic boundary of the domain layer _(enforced)_
- ADR-023: Deterministic Gate Invariant _(enforced)_
- ADR-008: Centralize halt conditions in HALT.md _(enforced)_

**Guidelines:**
- testing-a-change.md
- versioning.md

**Failure Patterns:**
- Stealth Merge Commits*(Sprint 6)*: Implicit merges from `git pull` violated the "No-Merge" policy. `arch review` initially failed to block them effectively due to a bug in `MergeCommitCheck` (it found the last 20 merges instead of checking the last 20 commits). **Resolved:** Fixed `MergeCommitCheck` in `cli/src/main/ts/infrastructure/cli/git-cli.ts` and hardened protocol. _(docs/KAIZEN-LOG.md)_
- Decision Blindness (High Velocity)*(Sprint 3)*: The agent executes architectural changes (ADR) and detects bugs (TASK-061) that stay in logs or PRs without immediate human visibility. High velocity (35 tasks/48h) makes individual monitoring impossible. **Proposal:** GOVERNANCE.md contract + INBOX.md weekly dashboard + `arch inbox` agent. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

### Acceptance Criteria

- [ ] `DriftChecker` implements `ExcisionStructuralCheck` with Gate 1 (reference-clean), Gate 2 (decision-record exists), and Gate 3 (build-clean) logic.
- [ ] Protected-path deletions passing all 3 gates emit `ExcisionCheck: PASS` and do not require an ADR; failures emit `ExcisionCheck: FAIL` with an ADR requirement.
- [ ] `arch review` passes.  →  cmd: arch review; exit: 0

### Definition of Done

- [ ] `ExcisionStructuralCheck` implemented in DriftChecker with correct PASS/FAIL/WARN result logic.
- [ ] `arch review` passes.
