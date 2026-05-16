## TASK-207: Implement DeterministicACVerifier - structural AC completion check
**Meta:** P2 | M | DONE | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/domain/services/, cli/src/main/ts/application/commands/, cli/src/main/ts/application/use-cases/review-system.ts
**Closed-at:** 2026-05-16T17:12:28.690Z
**Depends:** none

### Context
AC completion is currently checkbox state only — the agent marks its own checkboxes with no independent verification. This task introduces a `DeterministicACVerifier` service that evaluates each AC against its declared verification type, returning a structured pass/fail with auditable evidence.

This replaces the previous LLM-based design. Verification of governance conditions is a structural question with a binary answer. It must not depend on model confidence. See [IDENTITY.md § 7](../IDENTITY.md) — Deterministic Core Invariant.

**AC verification types** (declared inline in the AC string after `→`):
- `cmd: <shell-command>; exit: <code>` — run command, assert exit code
- `file: <path>` — assert file exists
- `code: <description>` — read the file, check the condition structurally (AST or text match)
- `test: <description>` — assert test suite passes (delegates to `npm test`)
- `prose: <description>` — checkbox state only; no automated verification possible

A prerequisite sub-task is storing `lockedCommit` SHA in `MarkTaskInProgress` so the diff boundary is deterministic.

### Acceptance Criteria
- [x] `MarkTaskInProgress` stores the current `git rev-parse HEAD` SHA as `lockedCommit` in the task file meta line → prose: verified by checking a task file after `arch task start` runs
- [x] `DeterministicACVerifier` service at `cli/src/main/ts/domain/services/deterministic-ac-verifier.ts` with `verify(task: Task): Promise<VerificationResult>` where `VerificationResult = { pass: boolean; evidence: ACEvidence[] }` and `ACEvidence = { ac: string; type: VerificationType; pass: boolean; detail: string }` → code: verified by reading the file
- [x] Verifier parses each AC string for its `→ <type>:` suffix and dispatches to the matching check strategy → code: verified by reading the implementation
- [x] `cmd:` strategy: executes the declared shell command, asserts exit code matches expectation, captures stdout/stderr as `detail` → code: verified by unit test
- [x] `file:` strategy: asserts the declared path exists on disk → code: verified by unit test
- [x] `test:` strategy: runs `npm test` in the declared directory, asserts exit 0 → code: verified by unit test
- [x] `prose:` and `code:` strategies: return `pass: true` (human-verified or reader-verified), logged as non-automated in evidence → code: verified by unit test
- [x] If any `cmd:` or `file:` AC fails, overall result is `pass: false` → code: verified by unit test
- [x] `arch verify-acs <task-id>` command: resolves task, calls verifier, prints per-AC evidence table and overall pass/fail → prose: verified by running the command
- [x] `ReviewSystem` calls verifier before archive; if `pass: false`, blocks archive with evidence printed to stderr → code: verified by reading review-system.ts
- [x] Unit tests cover: all-pass, cmd-fail, file-missing, prose-only (no automation), mixed types → test: `npm test` passes in `cli/`
- [x] `arch review` passes → cmd: `arch review`
- [x] `npm test` passes in `cli/` → cmd: `cd cli && npm test`

### Definition of Done
- [x] All ACs checked.
- [x] `arch review` passes.
- [x] `npm test` passes in `cli/`.
- [x] No LLM call exists anywhere in the verification path.

## Hansei
**Severity:** H0
**Category:** [SpecDrift]

**Decision:**
Focus shifted to TASK-245 per constitutional preemption rules (AGFM).

**Constraint:**
Metadata update only; task remains in READY status.

**Cost:**
None. Staged metadata update for focus-sovereignty alignment.

**Forward Action:**
No forward action required for this metadata change.
