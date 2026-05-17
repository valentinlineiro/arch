## {{TASK_ID}}: {{TITLE}}
**Meta:** {{PRIORITY}} | {{SIZE}} | READY | Focus:no | 2-code-generation | {{CLI}} | {{CONTEXT}}

**Depends:** none

### Context

{{CONTEXT_DESCRIPTION}}

### Acceptance Criteria

- [ ] Implementation file exists at declared path
  - `file: {{CONTEXT}}`

- [ ] CLI command/entrypoint exits 0 (replace with actual invocation)
  - `cmd: node dist/index.js --help; exit: 0`

- [ ] Test suite passes
  - `cmd: npm test; exit: 0`

- [ ] `arch review` passes
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
