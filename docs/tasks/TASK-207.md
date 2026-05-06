## TASK-207: Implement SemanticACVerifier — LLM-based AC completion check
**Meta:** P1 | M | READY | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/domain/services/, cli/src/main/ts/application/commands/, cli/src/main/ts/application/use-cases/review-system.ts
**Depends:** none

### Context
AC completion is currently checkbox state only — the agent marks its own checkboxes with no independent verification. This task introduces a `SemanticACVerifier` service that routes the task spec, completed ACs, and git diff to a reasoning model via `ProviderRegistry` (TASK-199), returning a structured pass/fail with confidence level. This is the prerequisite for L3 self-archive (TASK-208).

A prerequisite sub-task is storing `lockedCommit` SHA in `MarkTaskInProgress` so the diff boundary is deterministic.

### Acceptance Criteria
- [ ] `MarkTaskInProgress` stores the current `git rev-parse HEAD` SHA as `lockedCommit` in the task file meta line → prose: verified by checking a task file after `arch exec` starts it
- [ ] `SemanticACVerifier` service at `cli/src/main/ts/domain/services/semantic-ac-verifier.ts` with `verify(task: Task, diff: string): Promise<VerificationResult>` where `VerificationResult = { pass: boolean; confidence: 'high' | 'medium' | 'low'; evidence: string }` → code: verified by reading the file
- [ ] Verifier builds prompt from task description + ACs + diff, routes through `ProviderRegistry` at M tier → prose: verified by reading the implementation
- [ ] Circuit-breaker: if diff exceeds 500 lines, skip LLM call and return `{ pass: false, confidence: 'low', evidence: 'diff too large for automated verification' }` → code: verified by unit test
- [ ] `arch verify-acs <task-id>` command added: resolves the task, computes diff from `lockedCommit` to HEAD, calls verifier, prints result → prose: verified by running the command manually
- [ ] `ReviewSystem` calls verifier after `arch review` passes; if confidence is `low`, adds `AWAITING_REVIEW` to INBOX instead of proceeding → code: verified by reading review-system.ts
- [ ] Unit tests cover: high-confidence pass, low-confidence fallback, circuit-breaker (diff > 500 lines), missing lockedCommit graceful degradation → test: `npm test` passes in `cli/`
- [ ] `arch review` passes → cmd: `arch review`
- [ ] `npm test` passes in `cli/` → cmd: `cd cli && npm test`

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
- [ ] `npm test` passes in `cli/`.
