## TASK-902: Pre-implementation detection: arch task next --verify
**Meta:** P2 | S | IN_PROGRESS | Focus:yes | 7-operations | claude-code | cli/src/main/ts/application/commands/next-command.ts, cli/src/main/ts/application/commands/task-command.ts

**Depends:** none

### Context

Four consecutive resurrected tasks in session 2026-05-16 were found fully implemented before any code was written. Each consumed focus ticks, govern cycles, and audit time. Pattern: IDEAs from before major rewrites (DriftChecker v2, EscalationStore, HanseiAuditor) were promoted without verifying the implementation already existed.

`DeterministicACVerifier` already exists. This task wires it into `arch task next` as an optional pre-flight flag.

### Acceptance Criteria

- [ ] `arch task next --verify` runs `DeterministicACVerifier.verify()` on the focus task before returning it.
  - `cmd: node cli/dist/index.js task next --verify`

- [ ] If all `cmd:` and `file:` predicates pass AND evidence contains ≥1 non-prose AC: emit `[PRE-IMPL] TASK-XXX — all predicates already pass. Verify this task is not pre-implemented before starting.` to stderr. Task is still returned (non-blocking — exit 0).
  - `cmd: node cli/dist/index.js task next --verify`

- [ ] If any predicate fails or evidence is prose-only: no warning emitted. Normal output.
  - `cmd: node cli/dist/index.js task next --verify`

- [ ] `arch task next` (without `--verify`) is unchanged — no predicate runs, no warning.
  - `cmd: node cli/dist/index.js task next`

- [ ] Unit test: focus task with all passing cmd predicates triggers PRE-IMPL warning.
  - `cmd: npm test`

- [ ] Unit test: focus task with failing cmd predicate emits no warning.
  - `cmd: npm test`

- [ ] `arch review` passes.
  - `cmd: node cli/dist/index.js review`

### Definition of Done
- [ ] All ACs checked by Auditor
- [ ] `arch review` passes
- [ ] `npm test` passes in `cli/`

## Hansei
**Severity:** H0
**Category:** [no-issue]
**Decision:** Not yet started.
**Constraint:** None.
**Cost:** None.
**Forward Action:** None.
