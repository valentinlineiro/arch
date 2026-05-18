## TASK-928: Fix ApprovalPresent checker reads wrong meta field for class exemption
**Meta:** P2 | XS | DONE | Focus:no | 2-code-generation | claude | cli/src/main/ts/application/use-cases/drift-checker.ts
**Closed-at:** 2026-05-18T09:00:00Z

### Context

Promoted from IDEA-approval-checker-field-index (surfaced in TASK-927 audit).

`drift-checker.ts:checkApprovalPresent` reads `parts[5]` to get the task class for the L2 exemption (`6-writing`, `7-operations`). In the current meta format (`P | size | STATUS | Focus:... | class | cli | context`), `parts[4]` is the class field and `parts[5]` is the CLI field. The checker reads the wrong field, so the exemption never fires for new-format tasks, producing false-positive `ApprovalPresent` warnings.

Old meta format (`P | size | num | STATUS | Sprint | class | cli`) happens to have class at `parts[5]`, so it worked before the format evolved.

### Acceptance Criteria

- [x] `checkApprovalPresent` identifies the class field correctly for both old and new meta formats.
- [x] Existing XS 6-writing/7-operations archived tasks do not appear in `ApprovalPresent` warnings.
- [x] No regression in existing `arch review` checks.

### Definition of Done
- [x] Tests pass.
- [x] `arch review` passes.

## Approval

**Approved-by:** human (via TASK-927 triage)
**Approved-at:** 2026-05-18T09:00:00Z

## Hansei

**Severity:** H1
**Category:** [SpecDrift]
**Decision:** Fixed by scanning all pipe-separated meta fields for the class pattern instead of reading a hardcoded index. The bug was introduced when the meta format added `Focus:yes/no` at position 3, shifting the class from parts[5] to parts[4] — the checker was never updated. The fix is format-agnostic and handles both old and new layouts.
**Constraint:** Cannot use a fixed field index for class extraction; the field count differs between old (8+ fields) and new (7 fields) meta formats. Scan-based approach is required.
**Cost:** One session, minimal — the fix was two lines. Test coverage was the dominant effort.
**Forward Action:** None specific. If meta format evolves again, all field-position reads in drift-checker.ts should be audited.
