## TASK-932: Add archive status validation to drift-checker ArchiveMetaIntegrity
**Meta:** P2 | XS | DONE | Focus:no | 2-code-generation | claude | cli/src/main/ts/application/use-cases/drift-checker.ts | Closed-at: 2026-05-18T13:00:00Z

### Context

Promoted from IDEA-archive-status-drift-check (TASK-927 audit, finding 2).

`drift-checker.ts:checkArchiveMetaIntegrity` validates only the `size` field of archived task files. It does not check that the `status` field is `DONE`. Tasks with `READY`, `IN_PROGRESS`, or `REVIEW` status in `docs/archive/` (TASK-231, 234, 235, 236, 237) pass the check silently.

`ArchiveParser` already filters non-DONE tasks from metrics (TASK-926). The gap is that `arch review` itself does not surface this as a violation.

**Fix:** Use the same multi-format scan already in ArchiveParser — scan all pipe-separated meta fields for a known status token; flag if it is not `DONE`.

### Acceptance Criteria

- [x] `checkArchiveMetaIntegrity` flags files in `docs/archive/` whose status is not `DONE` or `REJECTED`.
- [x] `arch review` produces a WARN for TASK-231, 234, 235, 236, 237 (status READY in archive). Also surfaces TASK-215 (bonus find, same violation).
- [x] Tasks with DONE status are not affected.
- [x] REJECTED-status archived tasks (TASK-007, 021, 039, 097, 119, 160, 183) are not flagged — REJECTED is a valid terminal state.
- [x] Test covers: non-DONE archived task → WARN; DONE archived task → no warning.

### Definition of Done
- [x] Tests pass.
- [x] `arch review` surfaces the known READY-status violations as expected WARNs.

## Hansei

**Severity:** H1
**Category:** [SpecDrift]
**Decision:** Added status validation to `checkArchiveMetaIntegrity`. Scans all meta fields for known status token; flags non-terminal statuses (not DONE or REJECTED). Found 6 READY-status archived tasks (TASK-215, 231, 234, 235, 236, 237). Found REJECTED is a valid terminal state — not flagged.
**Constraint:** TASK-215 and 231-237 remain in archive with READY status; fixing those requires a separate corpus repair pass not in this task's scope.
**Cost:** Zero code risk — additive check only, no behavior change for previously-passing tasks.
**Forward Action:** The 6 READY-status archived tasks are now surfaced as WARN. They should be resolved in a follow-up corpus repair task (related to TASK-927 finding residual).
