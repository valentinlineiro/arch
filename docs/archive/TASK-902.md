## TASK-902: Pre-implementation detection: arch task next --verify
**Meta:** P2 | S | DONE | Focus:no | 7-operations | claude-code | cli/src/main/ts/application/commands/next-command.ts, cli/src/main/ts/application/commands/task-command.ts
**Closed-at:** 2026-05-16T22:37:15.281Z

**Depends:** none

### Context

Four consecutive resurrected tasks in session 2026-05-16 were found fully implemented before any code was written. Each consumed focus ticks, govern cycles, and audit time. Pattern: IDEAs from before major rewrites (DriftChecker v2, EscalationStore, HanseiAuditor) were promoted without verifying the implementation already existed.

`DeterministicACVerifier` already exists. This task wires it into `arch task next` as an optional pre-flight flag.

### Acceptance Criteria

- [x] `arch task next --verify` runs `DeterministicACVerifier.verify()` on the focus task before returning it.
  - `cmd: node cli/dist/index.js task next --verify`

- [x] If all `cmd:` and `file:` predicates pass AND evidence contains ≥1 non-prose AC: emit `[PRE-IMPL] TASK-XXX — all predicates already pass. Verify this task is not pre-implemented before starting.` to stderr. Task is still returned (non-blocking — exit 0).
  - `cmd: node cli/dist/index.js task next --verify`

- [x] If any predicate fails or evidence is prose-only: no warning emitted. Normal output.
  - `cmd: node cli/dist/index.js task next --verify`

- [x] `arch task next` (without `--verify`) is unchanged — no predicate runs, no warning.
  - `cmd: node cli/dist/index.js task next`

- [x] Unit test: focus task with all passing cmd predicates triggers PRE-IMPL warning.
  - `prose: 409 tests pass — verified during implementation`

- [x] Unit test: focus task with failing cmd predicate emits no warning.
  - `prose: 409 tests pass — verified`

- [x] `arch review` passes.
  - `cmd: node cli/dist/index.js review`

### Definition of Done
- [x] All ACs checked by Auditor
- [x] `arch review` passes
- [x] `npm test` passes in `cli/`

## Hansei
**Severity:** H0
**Category:** [AuditGap]
**Decision:** --verify flag added to NextCommand. Runs DeterministicACVerifier on focus task, emits [PRE-IMPL] to stderr when all predicates pass with >=1 cmd/file AC. Non-blocking (exit 0). Two unit tests pass.
**Constraint:** Dynamic import of DeterministicACVerifier in NextCommand adds minor startup latency on --verify path only.
**Cost:** None — no architectural debt introduced.
**Forward Action:** None required.

## Approval
Approved-by: Auditor | 2026-05-16
