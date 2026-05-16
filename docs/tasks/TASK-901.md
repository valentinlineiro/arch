## TASK-901: Socratic Hansei Wizard: interactive Hansei fill in arch task done
**Meta:** P1 | M | READY | Focus:no | 1-code-reasoning | claude-code | cli/src/main/ts/application/use-cases/, cli/src/main/ts/application/commands/task-command.ts

**Depends:** none

### Context

Hansei is treated as ceremony — users fill it in hastily or leave fields shallow. The wizard replaces the blank form with targeted Socratic questions assembled from the task's metadata (size, actual turn count, Hansei categories). It forces diagnostic thinking without automating the thinking itself.

**Trigger:** wizard runs when `arch task done TASK-XXX` is called and `## Hansei` is absent or has any field empty/placeholder. Fully-populated Hansei skips the wizard entirely. Non-TTY sessions (CI/pipe) also skip — pre-filled Hansei required.

### Acceptance Criteria

- [ ] `HanseiWizard` service at `cli/src/main/ts/application/use-cases/hansei-wizard.ts`:
  - Detects whether Hansei is missing or has empty fields
  - Runs interactive prompts (readline) when TTY is available
  - Questions are derived from task metadata: size vs actual turns delta, task class, context paths
  - Assembles answers into a valid `## Hansei` block matching ADR-019 schema (Severity, Category, Decision, Constraint, Cost, Forward Action)
  - Returns the completed Hansei string; caller writes it to the task file
  - `file: cli/src/main/ts/application/use-cases/hansei-wizard.ts`

- [ ] `MarkTaskDone.execute()` calls `HanseiWizard` before `TaskValidator.validateHansei()` when in TTY context and Hansei is incomplete.
  - `file: cli/src/main/ts/application/use-cases/mark-task-done.ts`

- [ ] Wizard presents at minimum three questions:
  1. Severity selection (H0/H1/H2/H3a/H3b) with one-line description of each
  2. Category selection from valid ADR-019 list with brief labels
  3. "What is the single constraint discovered?" (free text, min 15 chars enforced)
  - `file: cli/src/main/ts/application/use-cases/hansei-wizard.ts`

- [ ] Non-TTY path (`process.stdout.isTTY === false`): wizard is skipped; if Hansei is missing, `MarkTaskDone` emits a clear error message: `Hansei required. Run in a TTY or pre-fill ## Hansei in the task file.` and exits 1.
  - `cmd: echo "" | node cli/dist/index.js task done TASK-XXX`

- [ ] Unit tests cover: wizard skipped when Hansei already complete, wizard skipped in non-TTY, assembled Hansei block passes `TaskValidator.validateHansei`.
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
