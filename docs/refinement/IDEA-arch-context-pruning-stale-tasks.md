# IDEA: ARCH Context Pruning — Stale Task Identification
**Status:** DRAFT
**Class:** 7-operations
**Size:** S
**Value:** 6

### Problem Statement
As the project evolves, tasks in `docs/tasks/` can become stale or irrelevant, but they continue to consume context during THINK cycles.

### Proposed Solution
Add a "Staleness Check" to `arch review` or a new command `arch prune` that:
1. Compares the last modification date of task files with the current date.
2. If a task has been in `READY` or `BLOCKED` status for > 30 days without a commit referencing its TASK-ID, flag it as STALE.
3. Propose moving STALE tasks to a `docs/tasks/stale/` directory or archiving them with a `REJECTED: stale` status.

### Dependencies
- None

### Sizing Estimate
S — Logic for git log check per file.
