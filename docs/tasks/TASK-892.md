## TASK-892: arch task create - Template-based Acceptance Criteria
**Meta:** P1 | S | REVIEW | Focus:no | 2-code-generation | local | cli/src/main/ts/
**Created-at:** 2026-05-15T08:15:00Z
**Depends:** none

### Acceptance Criteria
- [x] A template registry maps task class to a set of default ACs → grep: "TEMPLATE_REGISTRY" cli/src/main/ts/application/use-cases/create-task.ts
- [x] arch task create injects class-matched template ACs into the scaffolded task before any LLM call → prose: verified via arch task create smoke tests for 6-writing and 2-code-generation
- [x] LLM drafting supplements (not replaces) template ACs when a provider is available → prose: verified — LLM ACs merged with template ACs via Set deduplication
- [x] arch task create without a provider produces a valid task with template ACs → prose: verified by temporarily disabling LLM drafting and confirming skeleton + template output
- [x] arch review passes → cmd: node cli/dist/index.js review; exit: 0
- [x] npm test passes → cmd: npm test --prefix cli; exit: 0

### Context
#### Problem
`arch task create` currently relies on an LLM to draft ACs. This is brittle, requires an API call, and often produces vague results (as seen in TASK-891 smoke test).

#### Solution
Implement a template registry in `CreateTask.ts` that maps task class to a set of standard ACs. Template ACs are injected first; LLM ACs (if any) supplement them.

**Template structure (per class):**
- `2-code-generation`: Implement logic, add unit tests, arch review passes, npm test passes
- `6-writing`: Draft content, verify accuracy, arch review passes
- `7-operations`: Execute operation, verify outcome, arch review passes

### Definition of Done
- [x] All ACs checked → prose: all ACs above verified
- [x] arch review passes → cmd: node cli/dist/index.js review; exit: 0

## Hansei
**Severity:** H0
**Category:** [SpecDrift]
**Decision:** Implementation was straightforward. Extended the CLI to also parse the `--class` flag during `task create` to allow explicit template selection before the LLM (which might infer a different class) is called.
**Constraint:** The `TEMPLATE_REGISTRY` is currently hardcoded in the use case. If it grows significantly, it should move to a separate configuration or domain model.
**Cost:** Zero cost.
**Forward Action:** None.

