## TASK-263: DaaS Vision - implement arch explain command (Feature 5)
**Meta:** P2 | S | DONE | Focus:yes | 2-code-generation | claude | docs/refinement/, cli/src/main/ts/
**Actor:** unknown
**Locked-commit:** c20b1979
**Created-at:** 2026-05-19T12:56:29.126Z

### Context

The Discipline as a Service (DaaS) vision defined five features to reduce ARCH ceremony. Features 1–4 are complete. Feature 5, `arch explain`, provides on-demand glossary and ontology help so users can look up ARCH concepts without reading the full protocol docs. This task implements the remaining DaaS scope.


### Relevant Context
_confidence: 0.46_

**Files:**
- cli/src/main/ts/domain/models/context-index.ts _(core)_
- cli/src/main/ts/domain/models/task.ts _(core)_
- cli/src/main/ts/domain/services/deterministic-hansei-checker.ts _(core)_
- cli/src/main/ts/domain/task.ts _(core)_
- cli/src/main/ts/domain/services/signal-router.ts _(core)_

**ADRs:**
- ADR-017: Deterministic Observability & Operational Metrics _(enforced)_
- ADR-024: Drift Coverage Identity Model _(enforced)_
- ADR-008: Centralize halt conditions in HALT.md _(enforced)_

**Guidelines:**
- testing-a-change.md
- versioning.md

**Failure Patterns:**
- `arch --version` does not exist as a subcommand*(Sprint 3)*: The drift checker compares versions by reading package.json directly because the CLI does not implement `--version`. This is a functional workaround but inconsistent with standard CLI conventions. *(Resolved by TASK-072)* _(docs/KAIZEN-LOG.md)_
- Decision Blindness (High Velocity)*(Sprint 3)*: The agent executes architectural changes (ADR) and detects bugs (TASK-061) that stay in logs or PRs without immediate human visibility. High velocity (35 tasks/48h) makes individual monitoring impossible. **Proposal:** GOVERNANCE.md contract + INBOX.md weekly dashboard + `arch inbox` agent. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

### Acceptance Criteria

- [x] `arch explain <term>` returns a concise definition and usage context for ARCH ontology terms (e.g., Hansei, Focus, DriftChecker, READY).
- [x] The command covers at least the 20 most-used ARCH terms drawn from docs/guidelines/ and docs/adr/.
- [x] `arch review` passes.  →  cmd: arch review; exit: 0

### Definition of Done

- [x] `arch explain` command implemented and terms dictionary populated.
- [x] `arch review` passes.
