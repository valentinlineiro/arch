## IDEA: approval-checker-field-index

**Status:** PROMOTED
**Sessions:** 1
**Decision:** PROMOTE → TASK-928 (closed 2026-05-18). Fix implemented: scan all meta fields for class pattern rather than fixed index. Size exemption kept at XS only (S exemption is a separate TASK-FORMAT.md alignment question, not addressed here).

### Problem

`drift-checker.ts:checkApprovalPresent` (around line 884) reads `parts[5]` from the meta line to determine the task class for the L2 exemption:

```typescript
const taskClass = parts[5] ?? '';
if (size === 'XS' && (taskClass.includes('6-writing') || taskClass.includes('7-operations'))) {
  continue; // exempt
}
```

In the current meta format (`P | size | STATUS | Focus:... | class | cli | context`), `parts[4]` is the class field and `parts[5]` is the CLI field. The checker reads the wrong field, so the exemption never fires for `6-writing` or `7-operations` tasks with the new format, producing false-positive `ApprovalPresent` warnings.

Additionally, `docs/TASK-FORMAT.md:59` exempts only XS tasks, while `docs/AGENTS.md:142` and `docs/agents/DO.md:22` allow XS **and S** tasks to self-archive via the L3 gate. The code only checks `size === 'XS'`, missing the S case.

### Proposed Fix

1. Change `parts[5]` to `parts[4]` for class extraction (or use a named-field parser that is format-version-agnostic).
2. Align the size check with the L3 gate: `size === 'XS' || size === 'S'`.
3. Reconcile `TASK-FORMAT.md:59` with AGENTS.md/DO.md so the written spec matches the gate.

### Acceptance Criteria

- [ ] `checkApprovalPresent` reads the class field at the correct index.
- [ ] Existing XS 6-writing/7-operations archived tasks no longer appear in `ApprovalPresent` warnings.
- [ ] Size exemption aligned with the L3 gate specification (XS + S, or documented why only XS).
- [ ] `arch review` produces no false-positive `ApprovalPresent` warnings on known-clean tasks.

### Decision-required: no

## Decision
PROMOTE → TASK-928 (closed 2026-05-18). Fix implemented: scan all meta fields for class pattern rather than fixed index. Size exemption kept at XS only.
