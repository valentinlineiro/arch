## TASK-913: arch task split TASK-XXX : interactive task decomposition
**Meta:** P2 | S | READY | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/application/commands/task-command.ts

**Depends:** none

### Context

L tasks must be decomposed before READY but decomposition is fully manual : create files, copy context, set dependencies, archive original. No audit trail of the split. This task adds `arch task split` as a guided decomposition command.

### Acceptance Criteria

- [ ] `arch task split TASK-XXX` validates the task exists and is READY or IN_PROGRESS with size L or XL. Exits 1 with message if size is S/M.
  - `cmd: node cli/dist/index.js task split TASK-206`

- [ ] Non-interactive mode: `arch task split TASK-XXX --titles "Title A,Title B"` creates sub-tasks without prompting. Each sub-task inherits: class, cli, context, priority, and `Depends:` from parent. Assigns sequential IDs (next available). Writes `Spawned-from: TASK-XXX` field. Sets status READY.
  - `file: cli/src/main/ts/application/commands/task-command.ts`

- [ ] Original task is archived with status DONE, `Closed-at` timestamp, and Hansei entry: `Severity: H0, Category: [no-issue], Decision: Task decomposed into TASK-XXXa, TASK-XXXb via arch task split.`
  - `prose: verified manually after running the command`

- [ ] `arch task split TASK-XXX` with no `--titles` flag: interactive mode : prompts "How many sub-tasks?" (2-4) then title for each. Skips if non-TTY (prints usage).
  - `prose: verified manually in TTY`

- [ ] `arch review` passes after split.
  - `cmd: node cli/dist/index.js review`

- [ ] `npm test` passes.
  - `prose: verified during implementation`

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
