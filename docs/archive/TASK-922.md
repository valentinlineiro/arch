## TASK-922: arch capture v2: single intake command producing a READY task
**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/index.ts, cli/src/main/ts/application/commands/
**Closed-at:** 2026-05-17T22:06:24.493Z

**Depends:** TASK-921

### Context

New users and agents need a single command that takes an intent and produces a READY task without manual ceremony. Currently this requires: `arch task create` → edit ACs → `arch task start` (may fail DoR) → fix → retry. That's 3–5 steps for something that should be one.

### Acceptance Criteria

- [x] `arch capture "<intent>" [--class <class>] [--size <size>]` command: single entry point that orchestrates `arch task create` → validates DoR → if DoR fails, auto-applies fixes for mechanical violations (empty Size, missing CLI from config default) → retries → exits with the task ID and file path.
  - `cmd: node cli/dist/index.js capture "add JWT authentication middleware" --class 2-code-generation --size S`

- [x] If intent is missing required fields that cannot be auto-filled (e.g. context paths are genuinely unknown), `arch capture` prompts interactively (TTY) or exits 1 with a clear message (non-TTY): "Cannot infer context paths: pass --context or edit docs/tasks/TASK-XXX.md before running arch task start."
  - `prose: verified in non-TTY with missing context`

- [x] `arch capture` output: prints the created task ID, file path, and a summary of ACs generated. Suggests `arch task start TASK-XXX` as next step.
  - `prose: output verified`

- [x] `AGENTS.md` updated: `arch capture` documented as the primary intake command for new sessions.
  - `file: docs/AGENTS.md`

- [x] `arch review` passes.
  - `cmd: node cli/dist/index.js review`

- [x] `npm test` passes.
  - `prose: 415 tests pass — verified`

### Definition of Done
- [x] All ACs checked by Auditor
- [x] `arch review` passes
- [x] `npm test` passes in `cli/`

## Hansei
**Severity:** H0
**Category:** [AuditGap]
**Decision:** arch capture implemented as single intake command. Orchestrates CreateTask -> DoR validation -> auto-fix mechanical violations (CLI, context) -> IN_PROGRESS. AGENTS.md updated with arch capture as primary intake. Non-TTY exits 1 with clear message when manual fixes needed.
**Constraint:** Auto-fix only handles CLI and context path violations. Priority, Size, Class require human edit since they are intent-dependent.
**Cost:** No architectural debt introduced.
**Forward Action:** None required.
