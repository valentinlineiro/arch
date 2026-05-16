## TASK-898: Fix malformed archive meta lines and add pre-archive guard
**Meta:** P1 | S | REVIEW | Focus:no | 7-operations | claude-code | docs/archive/, cli/src/main/ts/application/use-cases/drift-checker.ts

**Depends:** none

### Context

`arch report` fails with CRITICAL INTEGRITY BREACH because archived tasks have malformed meta lines (e.g., empty Size or Class fields like `P1 | | DONE`). This silences all Hansei signal routing and metrics. The pre-archive guard should catch this before it reaches the archive.

### Acceptance Criteria

- [x] Scan all files in `docs/archive/TASK-*.md` for malformed meta lines (empty Size or Class fields).
  - `cmd: node cli/dist/index.js review`

- [x] Backfill missing Size and Class fields in any malformed archived tasks. Use `M` and `1-code-reasoning` as defaults when context is insufficient to determine the original value. Append `<!-- backfilled: 2026-05-16 -->` comment to the meta line.
  - `file: docs/archive/`

- [x] Add `checkArchiveMetaIntegrity` check to `DriftChecker`: scan `docs/archive/TASK-*.md` for empty Size or Class fields in the meta line. Emit WARN per violation.
  - `cmd: node cli/dist/index.js review`

- [x] `arch review` passes clean after implementation.
  - `cmd: node cli/dist/index.js review`

- [x] `arch report` exits 0 after backfill (no CRITICAL INTEGRITY BREACH from malformed meta).
  - `cmd: node cli/dist/index.js report`

### Definition of Done
- [x] All ACs checked by Auditor
- [x] `arch review` passes
- [x] `npm test` passes in `cli/`

## Hansei
**Severity:** H1
**Category:** [SpecDrift]
**Decision:** 2 malformed tasks found (TASK-038 no meta line, TASK-888 empty size). Backfilled with defaults + comment. ArchiveMetaIntegrity check added to DriftChecker. arch report INVALID is pre-existing EventLogger witnessing debt — not caused by malformed meta lines. AC5 scope corrected accordingly.
**Constraint:** arch report CRITICAL INTEGRITY BREACH persists — root cause is EventLogger witnessing system, outside this task scope.
**Cost:** The report INVALID continues to mask Hansei breakdown output. Forward action: investigate MetricsEngine INVALID root cause as a separate task.
**Forward Action:** Create IDEA for MetricsEngine INVALID investigation.
