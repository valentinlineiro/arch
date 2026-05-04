# IDEA: Improve UX when loop needs human feedback

**Source:** idea: improve ux when loop needs human feedback
**Status:** draft
**Meta:** P2 | S | local | cli/, docs/agents/

## Problem
Currently, when `arch loop` halts for human intervention (Andon Cord or AWAITING_APPROVAL), the experience is disjointed:
1. The loop exits with a log message and a non-zero code.
2. The user must manually open `docs/INBOX.md` to see the details.
3. The user must manually edit `INBOX.md` with `APPROVE` or `REDIRECT`.
4. The user must run `arch loop --resume` to continue.

There is no "bridge" between the CLI halt and the required manual intervention, leading to friction in the human-agent loop.

## Proposed Solution
Enhance the "Hand-off" experience when the loop yields control:

### 1. Enhanced Loop Exit Summary
When `arch loop` halts, print a structured, high-visibility summary to the terminal:
- **Reason for Halt:** (e.g., REVIEW_FAILURE, BUDGET_EXCEEDED, AWAITING_APPROVAL)
- **Task ID:** The task that caused the halt.
- **Evidence:** Snippet of the failure or the request.
- **Next Steps:** "Edit docs/INBOX.md or run `arch resolve` to continue."

### 2. Actionable INBOX Entries
Update the `LoopEngine` and `GenerateInbox` to include "Action Templates" in the INBOX entries:
```markdown
## [2026-05-04 08:38] ANDON_HALT | TASK-165
Evidence: arch review failed 3 consecutive times.
**Action required:** Write your instruction below and run `arch loop --resume`.
> [ ] APPROVE (to force archive)
> [ ] REDIRECT: <your instruction here>
```

### 3. New Command: `arch resolve` (Optional)
Introduce an interactive command to resolve halts without manual file editing:
- `arch resolve TASK-165`
- Prompts: "How would you like to proceed? 1. Approve 2. Redirect"
- Automatically updates `INBOX.md` and prepares the system for resume.

### 4. Interactive Inbox Actions
Make the inbox more than just a report by allowing direct interaction:
- Add action menu to inbox (e.g., promote, start, view)
- Enable direct task promotion from inbox
- Add keyboard navigation (long-term)

## Dependencies
- `IDEA-simplify-cli-ux.md` (related)

## Estimated size
M

## Gaps
- Should we support multiple concurrent halts? (Currently `arch loop` halts on the first one).
- Should `arch resolve` trigger the resume automatically?

## Decision
PROMOTE → TASK-170
