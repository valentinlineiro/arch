## TASK-892: arch task create - Template-based Acceptance Criteria
**Meta:** P1 | S | IN_PROGRESS | Focus:no | 2-code-generation | local | cli/src/main/ts/
**Depends:** none

### Acceptance Criteria
- [ ] A template registry maps task class to a set of default ACs → grep: "template" cli/src/main/ts/application/use-cases/create-task.ts
- [ ] arch task create injects class-matched template ACs into the scaffolded task before any LLM call → prose: verified by running arch task create with a known class and inspecting the output file
- [ ] LLM drafting supplements (not replaces) template ACs when a provider is available → prose: verified by inspecting scaffolded ACs — template ACs always present regardless of LLM availability
- [ ] arch task create without a provider produces a valid task with template ACs → prose: verified by running with no provider configured
- [ ] arch review passes → cmd: node cli/dist/index.js review; exit: 0
- [ ] npm test passes → cmd: npm test --prefix cli; exit: 0

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
- [ ] All ACs checked → prose: all ACs above verified
- [ ] arch review passes → cmd: node cli/dist/index.js review; exit: 0
