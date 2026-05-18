## IDEA: archive-status-drift-check

**Status:** DRAFT
**Sessions:** 1
**Decision:** UNDECIDED

### Problem

`drift-checker.ts:checkArchiveMetaIntegrity` (around line 1018) validates only the `size` field of archived tasks. It does not check that the `status` field is `DONE`. Archived tasks with `READY`, `IN_PROGRESS`, or `REVIEW` status in `docs/archive/` (e.g. TASK-231, 234, 235, 236, 237) pass the `ArchiveMetaIntegrity` check silently.

`ArchiveParser` now filters these out from metrics (fixed in TASK-926), but `arch review` still does not flag them as violations. The structural contract — that `docs/archive/` is the home of DONE tasks only — is not enforced at the review layer.

### Proposed Fix

Add a status validation in `checkArchiveMetaIntegrity`: flag any file in `docs/archive/` whose `Meta:` status field is not `DONE`. Use the same multi-format scan already implemented in `ArchiveParser` (scan all pipe-separated fields for a known status token).

### Acceptance Criteria

- [ ] `drift-checker.ts:checkArchiveMetaIntegrity` flags archived tasks with non-DONE status.
- [ ] `arch review` produces a WARN (or FAIL) for each TASK-231/234/235/236/237.
- [ ] Existing green tasks are not affected.

### Decision-required: no
