## TASK-922: arch capture v2: single intake command producing a READY task
**Meta:** P1 | S | READY | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/index.ts, cli/src/main/ts/application/commands/

**Depends:** TASK-921

### Context

New users and agents need a single command that takes an intent and produces a READY task without manual ceremony. Currently this requires: `arch task create` → edit ACs → `arch task start` (may fail DoR) → fix → retry. That's 3–5 steps for something that should be one.

### Acceptance Criteria

- [ ] `arch capture "<intent>" [--class <class>] [--size <size>]` command: single entry point that orchestrates `arch task create` → validates DoR → if DoR fails, auto-applies fixes for mechanical violations (empty Size, missing CLI from config default) → retries → exits with the task ID and file path.
  - `cmd: node cli/dist/index.js capture "add JWT authentication middleware" --class 2-code-generation --size S`

- [ ] If intent is missing required fields that cannot be auto-filled (e.g. context paths are genuinely unknown), `arch capture` prompts interactively (TTY) or exits 1 with a clear message (non-TTY): "Cannot infer context paths: pass --context or edit docs/tasks/TASK-XXX.md before running arch task start."
  - `prose: verified in non-TTY with missing context`

- [ ] `arch capture` output: prints the created task ID, file path, and a summary of ACs generated. Suggests `arch task start TASK-XXX` as next step.
  - `prose: output verified`

- [ ] `AGENTS.md` updated: `arch capture` documented as the primary intake command for new sessions.
  - `file: docs/AGENTS.md`

- [ ] `arch review` passes.
  - `cmd: node cli/dist/index.js review`

- [ ] `npm test` passes.
  - `cmd: npm test`

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
