## TASK-932: Add archive status validation to drift-checker ArchiveMetaIntegrity
**Meta:** P2 | XS | READY | Focus:no | 2-code-generation | claude | cli/src/main/ts/application/use-cases/drift-checker.ts

### Context

Promoted from IDEA-archive-status-drift-check (TASK-927 audit, finding 2).

`drift-checker.ts:checkArchiveMetaIntegrity` validates only the `size` field of archived task files. It does not check that the `status` field is `DONE`. Tasks with `READY`, `IN_PROGRESS`, or `REVIEW` status in `docs/archive/` (TASK-231, 234, 235, 236, 237) pass the check silently.

`ArchiveParser` already filters non-DONE tasks from metrics (TASK-926). The gap is that `arch review` itself does not surface this as a violation.

**Fix:** Use the same multi-format scan already in ArchiveParser — scan all pipe-separated meta fields for a known status token; flag if it is not `DONE`.

### Acceptance Criteria

- [ ] `checkArchiveMetaIntegrity` flags files in `docs/archive/` whose status is not `DONE`.
- [ ] `arch review` produces a WARN for TASK-231, 234, 235, 236, 237 (status READY in archive).
- [ ] Tasks with DONE status are not affected.
- [ ] Test covers: non-DONE archived task → WARN; DONE archived task → no warning.

### Definition of Done
- [ ] Tests pass.
- [ ] `arch review` passes (and surfaces the 5 known violations as expected WARNs).

## Hansei

**Severity:** H1
**Category:** [SpecDrift]
**Decision:** Placeholder — to be filled at close.
**Constraint:** Placeholder — to be filled at close.
**Cost:** Placeholder — to be filled at close.
**Forward Action:** Placeholder — to be filled at close.
