# ARCH INBOX

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
