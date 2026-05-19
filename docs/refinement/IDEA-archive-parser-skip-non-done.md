## IDEA: archive-parser-skip-non-done

**Status:** DRAFT
**Sessions:** 2 | **Decision-required:** yes
**Decision:** UNDECIDED

### Problem

`ArchiveParser.parseArchivedTasks()` reads all `.md` files in `docs/archive/` regardless of their `Meta:` status field. Tasks with `READY`, `IN_PROGRESS`, or `REVIEW` status in the archive are counted as completed tasks and included in cycle-time and integrity calibration. This causes false INVALID signals when those tasks have a git-derived `completedAt` but no DONE event in `EVENTS.md`.

Currently 5 such tasks exist: TASK-231, TASK-234, TASK-235, TASK-236, TASK-237 (all `READY` status in archive).

### Proposed Fix

Add a status filter in `parseArchivedTasks()`: skip any file whose `Meta:` line does not contain `DONE` as the status token. Tasks in the archive with non-DONE status are either legacy errors or in-flight anomalies; excluding them from metrics is the correct semantic.

### Acceptance Criteria

- [ ] `ArchiveParser.parseArchivedTasks()` skips files with non-DONE status.
- [ ] Existing tests remain green.
- [ ] `arch report` still counts TASK-231/234-237 correctly if their status is corrected to DONE.

### Decision-required: no
