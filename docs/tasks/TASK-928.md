## TASK-928: Fix ApprovalPresent checker reads wrong meta field for class exemption
**Meta:** P2 | XS | IN_PROGRESS | Focus:no | 2-code-generation | claude | cli/src/main/ts/application/use-cases/drift-checker.ts

### Context

Promoted from IDEA-approval-checker-field-index (surfaced in TASK-927 audit).

`drift-checker.ts:checkApprovalPresent` reads `parts[5]` to get the task class for the L2 exemption (`6-writing`, `7-operations`). In the current meta format (`P | size | STATUS | Focus:... | class | cli | context`), `parts[4]` is the class field and `parts[5]` is the CLI field. The checker reads the wrong field, so the exemption never fires for new-format tasks, producing false-positive `ApprovalPresent` warnings.

Old meta format (`P | size | num | STATUS | Sprint | class | cli`) happens to have class at `parts[5]`, so it worked before the format evolved.

### Acceptance Criteria

- [ ] `checkApprovalPresent` identifies the class field correctly for both old and new meta formats.
- [ ] Existing XS 6-writing/7-operations archived tasks do not appear in `ApprovalPresent` warnings.
- [ ] No regression in existing `arch review` checks.

### Definition of Done
- [ ] Tests pass.
- [ ] `arch review` passes.

## Hansei

**Severity:** H1
**Category:** [SpecDrift]
**Decision:** Placeholder — to be filled at close.
**Constraint:** Placeholder — to be filled at close.
**Cost:** Placeholder — to be filled at close.
**Forward Action:** Placeholder — to be filled at close.
