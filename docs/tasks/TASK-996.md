## TASK-996: Register arch analyze in index.ts: command built but not wired
**Meta:** P2 | XS | READY | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/index.ts

**Depends:** none

### Context

`analyze-command.ts` implements `arch analyze` including promotion proposals (TASK-966), but the command was never registered in `index.ts`. Running `arch analyze` shows the help screen instead of the command output. The implementation is complete — only the dispatch case is missing.

### Acceptance Criteria

- [x] `case 'analyze':` added to `index.ts` dispatch switch, importing and executing `AnalyzeCommand`
  - `cmd: node cli/dist/index.js analyze; exit: 0`

- [x] `arch review` passes
  - `cmd: node cli/dist/index.js review`

### Definition of Done
- [ ] AC checked by Auditor
- [ ] `arch review` passes

## Hansei
**Severity:** H0
**Category:** [no-issue]
**Decision:** Not yet started.
**Constraint:** None.
**Cost:** None.
**Forward Action:** None.
