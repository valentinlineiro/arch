# REFINEMENT.md
<!-- Ideas being refined before entering BACKLOG -->
<!-- One draft at a time. Promote or reject before adding next. -->

## Current draft

### Mandatory EXEC Commits before REVIEW
**Problem:** The EXEC agent can complete a task implementation and move it to `REVIEW` status without committing the resulting files (e.g., ADRs, code). This creates status drift where a task is "ready for review" but the changes aren't in the repository.
**Proposal:** Update `docs/agents/EXEC.md` to include a mandatory "Commit artifacts" step as the final action before changing status to `REVIEW`.
**Impact:** Prevents status drift and ensures reviewers always have the latest code in the branch.

---

## Refinement history

| Date | Title | Outcome |
|------|-------|---------|
| 2026-04-23 | REVIEWER agent protocol | Promoted to TASK-012 (BACKLOG) |
| 2026-04-23 | HUMAN agent dual-file sync on sprint move | Promoted to TASK-013 (BACKLOG) |
