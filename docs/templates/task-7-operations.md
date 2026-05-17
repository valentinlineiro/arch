## {{TASK_ID}}: {{TITLE}}
**Meta:** {{PRIORITY}} | {{SIZE}} | READY | Focus:no | 7-operations | {{CLI}} | {{CONTEXT}}

**Depends:** none

### Context

{{CONTEXT_DESCRIPTION}}

### Acceptance Criteria

- [ ] Operation completes successfully (replace with actual command)
  - `cmd: <your command>; exit: 0`

- [ ] Output file/artifact exists at expected path (if applicable)
  - `file: {{CONTEXT}}`

- [ ] Idempotent: running again produces no errors
  - `cmd: <your command>; exit: 0`

- [ ] `arch review` passes
  - `cmd: node cli/dist/index.js review`

### Definition of Done
- [ ] All ACs checked by Auditor
- [ ] `arch review` passes

## Hansei
**Severity:** H0
**Category:** [no-issue]
**Decision:** Not yet started.
**Constraint:** None.
**Cost:** None.
**Forward Action:** None.
