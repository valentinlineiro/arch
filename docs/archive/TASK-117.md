# TASK-117: Autofocus next best task after completion
**Meta:** P2 | XS | 7 | DONE | Focus:yes | 7-operations | local | scripts/arch.sh
**Closed-at:** 2026-04-28T12:44:51Z

## Description
Implement automatic selection and focusing of the next best task after a task is marked DONE.

## Acceptance Criteria
- [x] Modify `scripts/arch.sh` `done` command (or equivalent) to trigger autofocus.
- [x] Use `arch rank` (if implemented) or logic to find the highest Value/Size ratio task.
- [x] Update the selected task to `Focus:yes`.
- [x] Notify the user about the auto-focused task.
- [x] `arch review` passes.

## Context
- `idea-rank-autofocus.md`
- `scripts/arch.sh`
