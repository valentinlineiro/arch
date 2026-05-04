# IDEA: Dynamic Interactive Inbox (Non-file based)

**Source:** idea: make inbox interactive. I think it's a bad idea having it as a file
**Status:** draft
**Meta:** P1 | M | local | cli/, docs/INBOX.md

## Problem
Currently, `docs/INBOX.md` acts as a middle-man "cached" state of the system.
1. **Stale Information:** If a task status changes, the inbox becomes stale until `arch inbox` (or `arch govern`) is run again.
2. **Editing Friction:** Humans must manually edit a Markdown file to approve or redirect tasks, which is slow and error-prone.
3. **Redundancy:** Much of the information in `INBOX.md` is already available in task files or git logs.

The user suggests that a static file is a "bad idea" for an interactive coordination mechanism.

## Proposed Solution
Move from a "Cached File" model to a "Dynamic TUI/CLI" model.

### 1. Dynamic `arch inbox` (The View)
Instead of generating a file, `arch inbox` becomes a dynamic command (potentially a TUI) that:
- Scans `docs/tasks/` and `docs/archive/` in real-time.
- Checks git for uncommitted changes or recent drifts.
- Aggregates "Action Required" items (Review requests, Halts, Approval requests) dynamically.

### 2. Interaction via CLI/TUI (The Actions)
Instead of writing `APPROVED` in a file:
- Use `arch approve TASK-XXX` or an interactive menu in `arch inbox`.
- The CLI command then performs the necessary state change (e.g., updates task meta, moves file to archive, or adds a commit message).

### 3. Where does the "Communication Log" go?
If we remove `docs/INBOX.md`, we still need to persist human instructions (approvals, redirects).
- **Option A (Task Files):** Append human feedback/approvals directly to the task file's "Communication" or "Log" section.
- **Option B (Git Tags/Notes):** Use git metadata for ephemeral approvals.
- **Option C (Minimal INBOX):** Keep a minimal `INBOX.md` only for human-written instructions, but remove the auto-generated summaries.

## Dependencies
- `TASK-170` (needs to be pivoted/re-decomposed)
- `ADR-001` (Compliance: All actions must still result in git commits)

## Estimated size
M

## Decision
PROMOTE → TASK-172
