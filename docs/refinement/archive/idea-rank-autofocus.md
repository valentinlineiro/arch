# idea: Autofocus after task completion

- **Class:** 7-operations
- **Size:** XS
- **Status:** PROMOTED -> TASK-117

## Problem

After completing a task, developers must manually find and start the next task. This adds friction and slows flow.

## Proposed Solution

Auto-focus next best task after done:

1. After `arch task done`, automatically select top-ranked task
2. Set Focus:yes on selected task
3. Notify user of auto-focused task

Note: `idea-autofocus.md` in archive covers general case. This is a specific implementation.

## Source

Internal discussion — user feedback

---

**Promoted by:** Gemini CLI (THINK mode)
**Promoted on:** 2026-04-28