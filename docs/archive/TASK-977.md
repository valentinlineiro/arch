## TASK-977: Implement Semantic Architectural Inference Engine (audit v1.2)
**Meta:** P3 | M | DONE | Focus:no | 2-code-generation | local | docs/tasks/
**Closed-at:** 2026-05-20T17:05:00Z
**Depends:** none

### Acceptance Criteria
- [x] Semantic model `audit-inference.ts` defines InferredArchitecturalPattern and MigrationTrend
- [x] `GitSemanticExtractor` captures diff chunks with `--patch`
- [x] `SignalExtractionEngine` detects technology signals with polarity
- [x] `PatternEngine` calculates trajectory, stability, and spread factors
- [x] `ADRInferenceEngine` generates explainable IAPs with confidence factors
- [x] `SignalCache` implements engine-versioned incremental persistence
- [x] `arch audit` renders semantic patterns and init recommendations
- [x] `arch review` passes
  - `cmd: node cli/dist/index.js review`

### Context
This task evolves the ARCH `audit` command from a simple topology-based alignment checker to a semantic inference engine. It introduces Layer 2 semantic analysis to discover undocumented architecture in brownfield repositories.

### Gaps
- v1.2 remains focused on technology/tooling signals (regex-based).
- Deep architectural patterns (CQRS, Boundaries) are not yet inferable without AST/higher-level analysis.
- Trajectory detection is a linear heuristic based on commit window splits.

### Relevant Context
_confidence: 0.88_

**Files:**
- cli/src/main/ts/domain/models/audit-inference.ts
- cli/src/main/ts/domain/services/pattern-engine.ts
- cli/src/main/ts/domain/services/adr-inference-engine.ts
- cli/src/main/ts/application/commands/audit-command.ts
- cli/src/main/ts/infrastructure/git/git-semantic-extractor.ts

### Context Feedback
- [x] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

#### Intent
Implement Semantic Architectural Inference Engine (audit v1.2) with trajectory detection, transition states, and epistemological versioning.

### Definition of Done
- [x] All ACs checked by Auditor
- [x] `arch review` passes

## Hansei
**Severity:** H1
**Category:** [SpecDrift]
**Decision:** Renamed SuggestedADR to InferredArchitecturalPattern mid-implementation to preserve epistemic humility.
**Constraint:** Trajectory detection required significant temporal sorting which was initially overlooked in the PatternEngine.
**Cost:** Added 2 implementation turns to refactor the model and update the rendering logic for explainability.
**Forward Action:** IDEA-deep-architectural-inference for post-regex pattern detection.

## Approval
Auditor: Valentín Liñeiro
Reviewed: 2026-05-20
All 8 ACs verified against actual repo state. `arch review` exits 0. Note: `audit-inference.ts` modifies a protected path — an ADR should be filed if this model is expected to evolve further.
