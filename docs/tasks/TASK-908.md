## TASK-908: arch review --task: scoped Auditor review command
**Meta:** P1 | S | IN_PROGRESS | Focus:yes | 2-code-generation | claude-code | cli/src/main/ts/application/commands/review-command.ts, cli/src/main/ts/application/use-cases/review-system.ts

**Depends:** none

### Context

`arch review` runs 24 checks against the full system. For an Auditor verifying a single REVIEW task, this is 23 irrelevant checks. The Auditor can't see AC evidence without triggering `arch task done`. This gap means L3 self-archive is less auditable than it should be — the evidence table only appears at close time.

### Acceptance Criteria

- [ ] `arch review --task TASK-XXX` command: runs scoped review for the named task only.
  Checks in order:
  1. DeterministicACVerifier — run all `cmd:` and `file:` predicates, emit per-AC result
  2. HanseiWizard.isHanseiComplete — verify Hansei is fully populated
  3. Meta line compliance — Priority, Size, Class present and valid
  Emits a clean evidence table to stdout. Exit 0 if all pass, exit 1 if any fail.
  - `cmd: node cli/dist/index.js review --task TASK-XXX`

- [ ] Full system review (`arch review` with no args) is unchanged.
  - `cmd: node cli/dist/index.js review`

- [ ] `ReviewCommand` detects `--task TASK-XXX` arg and delegates to scoped path instead of DriftChecker.
  - `file: cli/src/main/ts/application/commands/review-command.ts`

- [ ] `arch review --task` exits 1 when a `cmd:` predicate fails.
  - `cmd: node cli/dist/index.js review --task TASK-XXX`

- [ ] Unit tests: all-pass task → exit 0 + evidence table. Failing cmd predicate → exit 1.
  - `cmd: npm test`

- [ ] `arch review` passes clean after implementation.
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
