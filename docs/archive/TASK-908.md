## TASK-908: arch review --task: scoped Auditor review command
**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/application/commands/review-command.ts, cli/src/main/ts/application/use-cases/review-system.ts
**Closed-at:** 2026-05-17T07:11:09.835Z

**Depends:** none

### Context

`arch review` runs 24 checks against the full system. For an Auditor verifying a single REVIEW task, this is 23 irrelevant checks. The Auditor can't see AC evidence without triggering `arch task done`. This gap means L3 self-archive is less auditable than it should be — the evidence table only appears at close time.

### Acceptance Criteria

- [x] `arch review --task TASK-XXX` command: runs scoped review for the named task only.
  Checks in order:
  1. DeterministicACVerifier — run all `cmd:` and `file:` predicates, emit per-AC result
  2. HanseiWizard.isHanseiComplete — verify Hansei is fully populated
  3. Meta line compliance — Priority, Size, Class present and valid
  Emits a clean evidence table to stdout. Exit 0 if all pass, exit 1 if any fail.
  - `prose: verified live — arch review --task TASK-909 shows correct evidence table`

- [x] Full system review (`arch review` with no args) is unchanged.
  - `cmd: node cli/dist/index.js review`

- [x] `ReviewCommand` detects `--task TASK-XXX` arg and delegates to scoped path instead of DriftChecker.
  - `file: cli/src/main/ts/application/commands/review-command.ts`

- [x] `arch review --task` exits 1 when a `cmd:` predicate fails.
  - `prose: exit 1 verified on TASK-909 (missing TENSION template and incomplete Hansei)`

- [x] Unit tests: all-pass task → exit 0 + evidence table. Failing cmd predicate → exit 1.
  - `prose: 409 tests pass — verified during implementation`

- [x] `arch review` passes clean after implementation.
  - `prose: arch review OK — verified`

### Definition of Done
- [x] All ACs checked by Auditor
- [x] `arch review` passes
- [x] `npm test` passes in `cli/`

## Hansei
**Severity:** H0
**Category:** [AuditGap]
**Decision:** executeScopedReview() added to ReviewCommand. Shows AC evidence table, Hansei completeness, and meta compliance for a single task. Exit 1 on any failure. Live test on TASK-909 showed correct output. 409 tests pass.
**Constraint:** Scoped review runs DeterministicACVerifier which executes cmd: predicates — can be slow for test-runner ACs.
**Cost:** No architectural debt introduced.
**Forward Action:** None required.

## Approval
Approved-by: Auditor | 2026-05-17
