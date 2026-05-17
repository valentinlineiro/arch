## {{TASK_ID}}: {{TITLE}}
**Meta:** {{PRIORITY}} | {{SIZE}} | READY | Focus:no | 1-code-reasoning | {{CLI}} | {{CONTEXT}}

**Depends:** none

### Context

{{CONTEXT_DESCRIPTION}}

### Acceptance Criteria

- [ ] Design decision recorded — ADR or doc at declared path
  - `prose: decision documented at {{CONTEXT}}`

- [ ] All affected guidelines/docs updated to reflect the decision
  - `file: {{CONTEXT}}`

- [ ] Existing tests still pass after any doc changes
  - `prose: no breaking changes — verified`

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
