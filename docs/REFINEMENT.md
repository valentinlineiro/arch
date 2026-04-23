# REFINEMENT.md
<!-- Ideas being refined before entering BACKLOG -->
<!-- One draft at a time. Promote or reject before adding next. -->

## Current draft

**Status:** DRAFT
**Proposed by:** Valen
**Date:** 2026-04-23
**Source:** Sprint 1 observation — commits e5bc5c6 and aa8a0f1

### Proposal
When a task moves from BACKLOG to SPRINT, the HUMAN agent currently only
updates SPRINT.md. The corresponding entry in BACKLOG.md retains its old
status (e.g. `BACKLOG` or `READY`) instead of being updated or removed.
This caused a status-drift bug in Sprint 1 that required a manual sync commit.
The HUMAN agent's "Mueve [tarea(s)] al sprint" operation should atomically
update both files in a single operation.

### Gaps identified by AI
<!-- To be filled by REFINE agent -->
- [ ] Should the BACKLOG entry be updated (status → `IN_SPRINT`) or removed entirely?
- [ ] If updated: does it need a new status vocabulary term?
- [ ] If removed: how does CONDUCTOR know which tasks have been promoted?
- [ ] Is this a PATCH to HUMAN.md only, or does it also require CONDUCTOR protocol change?
- [ ] Should BACKLOG.md serve as a historical record (keep entries) or a live queue (remove on promotion)?

### Kaizen suggestions
<!-- To be filled by REFINE agent -->
_Pending first RETRO._

### Human decision
_Pending refinement_

---

## Refinement history

| Date | Title | Outcome |
|------|-------|---------|
| 2026-04-23 | REVIEWER agent protocol | Promoted to TASK-012 (BACKLOG) |
