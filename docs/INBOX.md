# ARCH INBOX

## [REVIEW_REQUEST] TASK-977
**Task:** TASK-977
**Title:** Implement Semantic Architectural Inference Engine (audit v1.2)
**Size:** M
**Submitted:** 2026-05-20T17:30:00Z
**Summary:** Evolves `arch audit` into a Semantic Inference Engine. Introduces `GitSemanticExtractor` (patch-based), `SignalExtractionEngine` (regex signals), `PatternEngine` (trajectory/stability/spread analysis), and `ADRInferenceEngine` (explainable IAPs). Implements engine-versioned caching to handle large repos and brownfield baseline generation for init recommendations.
**Changed files:**
- [cli/src/main/ts/domain/models/audit-inference.ts](file:///home/valentin/code/arch/cli/src/main/ts/domain/models/audit-inference.ts)
- [cli/src/main/ts/infrastructure/git/git-semantic-extractor.ts](file:///home/valentin/code/arch/cli/src/main/ts/infrastructure/git/git-semantic-extractor.ts)
- [cli/src/main/ts/domain/services/signal-extraction-engine.ts](file:///home/valentin/code/arch/cli/src/main/ts/domain/services/signal-extraction-engine.ts)
- [cli/src/main/ts/domain/services/noise-filter.ts](file:///home/valentin/code/arch/cli/src/main/ts/domain/services/noise-filter.ts)
- [cli/src/main/ts/domain/services/pattern-engine.ts](file:///home/valentin/code/arch/cli/src/main/ts/domain/services/pattern-engine.ts)
- [cli/src/main/ts/domain/services/adr-inference-engine.ts](file:///home/valentin/code/arch/cli/src/main/ts/domain/services/adr-inference-engine.ts)
- [cli/src/main/ts/domain/services/init-recommendation-engine.ts](file:///home/valentin/code/arch/cli/src/main/ts/domain/services/init-recommendation-engine.ts)
- [cli/src/main/ts/infrastructure/filesystem/signal-cache.ts](file:///home/valentin/code/arch/cli/src/main/ts/infrastructure/filesystem/signal-cache.ts)
- [cli/src/main/ts/application/commands/audit-command.ts](file:///home/valentin/code/arch/cli/src/main/ts/application/commands/audit-command.ts)
- [docs/tasks/TASK-977.md](file:///home/valentin/code/arch/docs/tasks/TASK-977.md)

## Loop Status
- **Active Tasks:** 2 (TASK-975, TASK-976)
- **READY Tasks:** 25

## Pending Items
- **AWAITING_REVIEW:** None
- **AWAITING_PROMOTION:** 11 items
  - IDEA-automatic-sprint-lifecycle
  - IDEA-corpus-informed-reprioritization
  - IDEA-deterministic-ac-expansion
  - IDEA-deterministic-governance-gates
  - IDEA-governance-epistemic-doctrine
  - IDEA-guided-close-path
  - IDEA-hansei-wizard
  - IDEA-semantic-compression-layer
  - IDEA-status-doc-refresh
  - IDEA-think-generated-proposals
  - IDEA-verifiability-first-templates

## Refinement Queue
- automatic-sprint-lifecycle
- corpus-informed-reprioritization
- deterministic-ac-expansion
- deterministic-governance-gates
- governance-epistemic-doctrine
- guided-close-path
- hansei-wizard
- semantic-compression-layer
- status-doc-refresh
- think-generated-proposals
- verifiability-first-templates

## Recently Completed
- TASK-968: Run architectural review of CLI with three outputs
- TASK-963: Refactor DriftChecker.checkExcisionStructure Gate 2
- TASK-962: Fix arch task done to scope unchecked AC check to Acceptance Criteria
- TASK-961: Fix archive parser to skip non-DONE tasks
- TASK-974: Command registry as single source of truth for CLI surface

## [REVIEW_REQUEST] TASK-976
ACs:
- Implementation file exists at declared context path: ARCH_CONTEXT_AXIOMS.md
- Tests pass
- `arch review` passes
Changed files:
- [ARCH_CONTEXT_AXIOMS.md](file:///home/valentin/code/arch/ARCH_CONTEXT_AXIOMS.md)
- [cli/src/main/ts/application/use-cases/build-index.ts](file:///home/valentin/code/arch/cli/src/main/ts/application/use-cases/build-index.ts)
- [cli/src/main/ts/application/use-cases/context-inference.ts](file:///home/valentin/code/arch/cli/src/main/ts/application/use-cases/context-inference.ts)
- [cli/src/main/ts/application/use-cases/decision-validator.ts](file:///home/valentin/code/arch/cli/src/main/ts/application/use-cases/decision-validator.ts)
- [cli/src/test/ts/build-index-v2.test.ts](file:///home/valentin/code/arch/cli/src/test/ts/build-index-v2.test.ts)
- [docs/tasks/TASK-976.md](file:///home/valentin/code/arch/docs/tasks/TASK-976.md)

## REVIEW_REQUEST
**Task:** TASK-954
**Title:** Temporal Pattern Layer for Causal Discovery
**Size:** M
**Submitted:** 2026-05-20T16:13:00Z
**Summary:** Adds TemporalIndex use-case (`.arch/temporal-index.jsonl` JSONL store), `recurs_in` RelationType, spike detection (≥3 occurrences in last 20 entries), integration into `arch ask` (Recurrence section) and `arch reflect` ([REFLECT-SUGGESTS] output), and causal signal emission on spike. All 6 temporal-index tests + 29 ask-corpus tests pass. `arch review` exits 0.

## REVIEW_REQUEST
**Task:** TASK-964
**Title:** Implement arch task hansei TASK-XXX interactive wizard
**Size:** M
**Submitted:** 2026-05-20T16:25:00Z
**Summary:** Wires `arch task hansei TASK-XXX` subcommand into task-command.ts routing to `HanseiWizard`. Adds `replaceHanseiBlock()` export (replaces or appends Hansei section in task file), `validateForwardAction()` method (H2 requires IDEA/TASK link), non-TTY guard (exits 1 if Hansei incomplete). 14 tests pass. `arch review` exits 0.

## REVIEW_REQUEST
**Task:** TASK-965
**Title:** Extend L3 self-archive eligibility to M tasks in 6-writing and 7-operations
**Size:** M
**Submitted:** 2026-05-20T16:50:00Z
**Summary:** Adds `file-contains:` and `not-file:` predicate types to DeterministicACVerifier (5 new tests). Extends tryL3Gate to allow M tasks in `6-writing`/`7-operations` when all ACs are deterministic and no protected path was modified (4 new tests). Also fixes silent predicate drop in parseACLines for new types. 15+26 tests pass. `arch review` exits 0.

## 2026-05-20 20:20:48 — Pattern Alerts
[PATTERN-ALERT] [SpecDrift] detected 8 times — systemic issue. See docs/tensions/

## 2026-05-20 20:20:48 — Alignment Audit
Alignment: 96/100
[EMERGENT] cli: 68 commits touch this directory but no ADR addresses it.
[EMERGENT] docs: 85 commits touch this directory but no ADR addresses it.
[EMERGENT] .arch: 49 commits touch this directory but no ADR addresses it.
