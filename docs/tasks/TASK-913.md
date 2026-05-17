## TASK-913: arch task split TASK-XXX : interactive task decomposition
**Meta:** P2 | S | IN_PROGRESS | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/application/commands/task-command.ts

**Depends:** none

### Context

L tasks must be decomposed before READY but decomposition is fully manual : create files, copy context, set dependencies, archive original. No audit trail of the split. This task adds `arch task split` as a guided decomposition command.

### Acceptance Criteria

- [x] `arch task split TASK-XXX` validates the task exists and is READY or IN_PROGRESS with size L or XL. Exits 1 with message if size is S/M.
  - `cmd: node cli/dist/index.js task split TASK-206`

- [x] Non-interactive mode: `arch task split TASK-XXX --titles "Title A,Title B"` creates sub-tasks without prompting. Each sub-task inherits: class, cli, context, priority, and `Depends:` from parent. Assigns sequential IDs (next available). Writes `Spawned-from: TASK-XXX` field. Sets status READY.
  - `file: cli/src/main/ts/application/commands/task-command.ts`

- [x] Original task is archived with status DONE, `Closed-at` timestamp, and Hansei entry: `Severity: H0, Category: [no-issue], Decision: Task decomposed into TASK-XXXa, TASK-XXXb via arch task split.`
  - `prose: verified manually after running the command`

- [x] `arch task split TASK-XXX` with no `--titles` flag: interactive mode : prompts "How many sub-tasks?" (2-4) then title for each. Skips if non-TTY (prints usage).
  - `prose: verified manually in TTY`

- [x] `arch review` passes after split.
  - `cmd: node cli/dist/index.js review`

- [x] `npm test` passes.
  - `prose: verified during implementation`

### Definition of Done
- [x] All ACs checked by Auditor
- [x] `arch review` passes
- [x] `npm test` passes in `cli/`

## Hansei
**Severity:** H1
**Category:** [SpecDrift]
**Decision:** arch task split implemented with non-interactive (--titles) and interactive (TTY) modes. Original L/XL task archived as DONE with split Hansei. Sub-tasks created with inherited class/cli/context/priority and Spawned-from field.
**Constraint:** arch task split does not automatically set Depends: chains between sub-tasks — ordering is the human's responsibility post-split.
**Cost:** Template literal with backticks inside caused a build failure — required string concatenation workaround. Minor friction.
**Forward Action:** None required.
