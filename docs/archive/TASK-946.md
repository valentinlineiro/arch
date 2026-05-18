## TASK-946: 1.0.0 release: fix reflect modePreamble bug, collapse context feedback, Metrics Narrowing, version bump
**Meta:** P1 | M | DONE | Focus:no | 2-code-generation | claude | cli/src/main/ts/application/commands/reflect-command.ts, cli/src/main/ts/application/use-cases/context-inference.ts, cli/package.json, docs/ROADMAP.md
**Closed-at:** 2026-05-18T15:01:00.519Z
**Depends:** none

### Acceptance Criteria
- [x] `modePreamble is not defined` error fixed in reflect-command.ts
  - `file: cli/src/main/ts/application/commands/reflect-command.ts`
- [x] Context feedback section collapsed to 3 lines (accurate/partial/off only)
  - `file: cli/src/main/ts/application/use-cases/context-inference.ts`
- [x] docs/tasks/ Census drops under 1500 lines (ADR-022 recalibrated budget) after rebuild + re-capture
  - `cmd: arch review; exit: 0`
- [x] Confidence threshold: context not injected when confidence < 0.1
  - `file: cli/src/main/ts/application/use-cases/context-inference.ts`
- [x] ROADMAP Phase 1 entries updated to reflect done work
  - `file: docs/ROADMAP.md`
- [x] package.json version bumped to 1.0.0
  - `file: cli/package.json`
- [x] `arch review` passes
  - `cmd: arch review; exit: 0`

### Context

### Gaps
- Census must drop below 1000 — existing task files have 13-line feedback blocks; simplifying feedbackSection() saves ~460 lines across 46 tasks
- Metrics Narrowing scoped to: (1) suppress <0.1 confidence injections, (2) ROADMAP entries updated; full observability dashboard is out of scope for 1.0.0

### Relevant Context
_confidence: 0.51_

**Files:**
- cli/src/main/ts/domain/models/reflect-decision.ts _(core)_
- cli/src/main/ts/domain/models/feedback-signal.ts _(core)_
- cli/src/main/ts/domain/services/archive-parser.ts _(core)_
- cli/src/main/ts/domain/models/causal-relation.ts _(core)_
- cli/src/main/ts/domain/services/metrics-engine.ts _(core)_

**ADRs:**
- ADR-015: Causal Signal Arbitration Layer _(enforced)_
- ADR-007: Census Context Budget Check in DriftChecker _(enforced)_
- ADR-018: Adversarially Robust Epistemology & Graded Integrity _(enforced)_

**Guidelines:**
- testing-a-change.md
- versioning.md

**Failure Patterns:**
- Completed Task Stagnation*(Sprint 5)*: `TASK-117` was marked DONE but remained in `docs/tasks/`, consuming context and potentially misleading agents. **Proposal:** Implement "Archival Guard" in THINK mode to autonomously move DONE tasks to `docs/archive/`. _(docs/KAIZEN-LOG.md)_
- Bugs without formal registration*(Sprint 3)*: `arch review` WARNs had no defined path to the backlog. TASK-041/042/043 were created manually after detection. The bug protocol (TASK-040) resolved this, but friction persisted throughout Sprint 2 and part of Sprint 3. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

#### Intent
1.0.0 release: fix reflect modePreamble bug, collapse context feedback to 3 lines (Census fix), suppress 0% confidence context signals (Metrics Narrowing), update ROADMAP, bump version

### Definition of Done
- [ ] All ACs checked by Auditor
- [x] `arch review` passes

## Hansei
**Severity:** H0
**Category:** [SpecDrift]
**Decision:** Not yet started.
**Constraint:** Work in progress — no constraint yet identified.
**Cost:** No cost incurred yet — task just started.
**Forward Action:** None.