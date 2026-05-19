## TASK-956: Implement two-track versioning architecture
**Meta:** P1 | M | IN_PROGRESS | Focus:no | 2-code-generation | claude | arch.config.json, cli/package.json, cli/src/main/ts/application/use-cases/drift-checker.ts, docs/PROTOCOL.md, docs/guidelines/versioning.md
**Actor:** unknown
**Locked-commit:** 9414abd1
**Created-at:** 2026-05-19T14:17:38.079Z
**Depends:** none

### Acceptance Criteria
- [ ] `arch.config.json` has `protocolVersion` and `minimumCliVersion` fields.  →  file: arch.config.json
- [ ] `cli/package.json` has `archProtocol` field.  →  file: cli/package.json
- [ ] `VersionCompat` drift check exists and returns FAIL when CLI < minimumCliVersion.  →  grep: VersionCompat cli/src/main/ts/application/use-cases/drift-checker.ts
- [ ] `VersionCompat` returns FAIL when archProtocol present but excludes protocolVersion.  →  prose: verified by test suite
- [ ] `VersionCompat` returns WARN when archProtocol absent.  →  prose: verified by test suite
- [ ] FAIL drift results are auto-promoted to violations in review-system.ts.  →  grep: status.*FAIL cli/src/main/ts/application/use-cases/review-system.ts
- [ ] `docs/PROTOCOL.md` exists with v1.0.0 entry.  →  file: docs/PROTOCOL.md
- [ ] `docs/guidelines/versioning.md` contains two-track semver policy.  →  grep: Protocol track docs/guidelines/versioning.md
- [ ] `docs/adr/ADR-025-versioning-architecture.md` exists.  →  file: docs/adr/ADR-025-versioning-architecture.md
- [ ] `npm test --prefix cli` passes.  →  cmd: npm test --prefix cli; exit: 0
- [ ] `arch review` passes.  →  cmd: arch review; exit: 0

### Context

Spec: docs/superpowers/specs/2026-05-19-arch-versioning-design.md
Plan: docs/superpowers/plans/2026-05-19-arch-versioning.md


### Relevant Context
_confidence: 0.44_

**Files:**
- cli/src/main/ts/domain/models/context-index.ts _(core)_
- .arch/focus-ledger.jsonl _(utility)_
- docs/METRICS.md _(utility)_
- cli/src/main/ts/application/use-cases/drift-checker.ts _(domain)_
- .arch/reflect-breach-log.jsonl _(utility)_

**ADRs:**
- ADR-016: Define the semantic boundary of the domain layer _(enforced)_
- ADR-008: Centralize halt conditions in HALT.md _(enforced)_
- ADR-024: Drift Coverage Identity Model _(enforced)_

**Guidelines:**
- testing-a-change.md
- versioning.md

**Failure Patterns:**
- Invariant Discovery Gap*(2026-05-12)*: The boundary ambiguity between `arch govern` (deterministic enforcement) and THINK (LLM analysis) was not surfaced by any ARCH mechanism. No DriftChecker rule, no structural check, no semantic scan detected it. A human noticed it during a reflection session. The specific risk: `arch govern` triggers THINK via `runConduct()`, creating naming confusion between enforcement and advisory synthesis — with no written invariant to refuse the rationalization "THINK already participates in govern, so it can also…". **Resolution:** Constitutional split written in IDENTITY.md §7. IDEA-architectural-tension-capture proposed as a new artifact class for structural ambiguities that are not yet broken but will be misused. **The deeper pattern:** ARCH models tasks, decisions, and causal edges, but not category errors or ontological drift. Invariants that live only in the author's head do not scale. _(docs/KAIZEN-LOG.md)_
- `arch --version` does not exist as a subcommand*(Sprint 3)*: The drift checker compares versions by reading package.json directly because the CLI does not implement `--version`. This is a functional workaround but inconsistent with standard CLI conventions. *(Resolved by TASK-072)* _(docs/KAIZEN-LOG.md)_

### Gaps

- `DriftResult.status` currently only supports `'OK' | 'WARN'`. Need to add `'FAIL'` and update `output-formatter.ts` and `review-system.ts` to handle it.
- `semver` npm package required for range validation — not currently a dependency.
- `arch.config.json` is a protected path — ADR-025 must be written before modifying.

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

#### Intent
implement two-track versioning architecture: protocolVersion/minimumCliVersion in arch.config.json, archProtocol in cli/package.json, VersionCompat drift check with FAIL status, PROTOCOL.md ledger, versioning.md rewrite

### Definition of Done
- [ ] All ACs checked by Auditor
- [ ] `arch review` passes

## Hansei
**Severity:** H0
**Category:** [SpecDrift]
**Decision:** Not yet started.
**Constraint:** Implementation in progress — Hansei to be completed at REVIEW time.
**Cost:** Implementation in progress — Hansei to be completed at REVIEW time.
**Forward Action:** None.