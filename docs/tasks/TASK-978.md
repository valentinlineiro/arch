## TASK-978: Pre-existence check in arch task start: detect pre-implemented tasks
**Meta:** P1 | S | IN_PROGRESS | Focus:no | 1-code-reasoning | claude-code | cli/src/main/ts/application/use-cases/mark-task-in-progress.ts

**Depends:** none

### Context

Tasks are sometimes scaffolded after the implementation already exists. The agent marks IN_PROGRESS, "implements" it (code already there), closes it — Hansei says H0 but the diff is empty. This inflates completed task count, produces misleading cycle time data, and caused 58% severity calibration understating in the last 12 measured tasks (TASK-267, 268, 279 — three recurrences same session).

`arch task start` validates DoR but doesn't check if implementation already exists. Fix: lightweight pre-existence check before marking IN_PROGRESS.

### Acceptance Criteria

- [ ] `MarkTaskInProgress.execute()` runs a pre-existence check before setting status.
  For each `file:` predicate in ACs: check if the file already exists.
  For each `cmd:` predicate: run it and capture exit code (non-blocking, 5s timeout).
  If ALL verifiable ACs already pass before any work: emit advisory warning.
  - `file: cli/src/main/ts/application/use-cases/mark-task-in-progress.ts`

- [ ] Warning message: "⚠ Pre-existence detected: all verifiable ACs pass before implementation. Consider closing directly with arch task done, or confirm this is genuinely new work."
  - `prose: verified by running arch task start on a task with already-passing ACs`

- [ ] Advisory only — does NOT block marking IN_PROGRESS. Agent decides.
  - `prose: arch task start completes normally despite warning`

- [ ] HanseiWizard receives `preExistenceDetected: boolean` hint. When true, wizard asks targeted question: "Was this pre-existing or did you implement it?" instead of generic Decision prompt.
  - `file: cli/src/main/ts/application/use-cases/hansei-wizard.ts`

- [ ] Unit tests: all-new task (no ACs pass) → no warning. All ACs pass → warning emitted.
  - `prose: 590+ tests pass`

- [ ] `arch review` passes.
  - `cmd: node cli/dist/index.js review`

### Definition of Done
- [ ] All ACs checked by Auditor
- [ ] `arch review` passes
- [ ] Tests pass

## Hansei
**Severity:** H0
**Category:** [no-issue]
**Decision:** Not yet started.
**Constraint:** None.
**Cost:** None.
**Forward Action:** None.
