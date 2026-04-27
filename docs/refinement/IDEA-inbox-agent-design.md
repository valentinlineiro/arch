# IDEA: Inbox Agent Technical Design
**Created:** 2026-04-27
**Source:** TASK-068
**Status:** DRAFT

## Proposal
Implement an automated process (`arch inbox`) that scans the system state and generates/updates `docs/INBOX.md`.

## Technical Components

### 1. Data Sources
- **`docs/tasks/`**: Scan for READY tasks, focus tasks, and tasks created by the system (bugs).
- **`docs/refinement/`**: Scan for DRAFT IDEAs.
- **Git Logs**: Calculate velocity (commits per period) and identify `[AUTO-MERGE]` actions.
- **`arch review`**: Capture system health status and warnings.

### 2. Logic (Selection Criteria)
- **Urgent**:
  - Tasks with `Focus:yes` but lacking human approval (per `GOVERNANCE.md`).
  - New bug tasks registered since last update.
  - Active PRs waiting for merge.
- **Pending**:
  - All files in `docs/refinement/` with `Status: DRAFT`.
- **Metrics**:
  - Tasks completed in the last 7 days.
  - Total READY vs DONE ratio.

### 3. Implementation Path
- **Phase 1 (Template-based)**: A simple script that uses `grep` and `find` to populate a Markdown template.
- **Phase 2 (CLI Integration)**: Integrate into `cli/src/main/ts/application/use-cases/generate-inbox.ts`.

## Decision
[TBD]
