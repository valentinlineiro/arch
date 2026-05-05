## TASK-192: [BUG] INBOX.md Refinement Queue section omits actual IDEA count
**Meta:** P1 | S | DONE | Focus:no | 6-writing | local | docs/agents/THINK.md, docs/INBOX.md
**Closed-at:** 2026-05-05T11:00:00.000Z
**Depends:** none

## Hansei
The INBOX Refinement Queue count was a small but critical visibility gap; fixing it ensures the human isn't blindsided by a growing backlog of ideas that aren't showing up in the primary dashboard.

### Context
THINK Phase 1 step 3 instructs INBOX regeneration but does not explicitly mandate scanning `docs/refinement/` for pending IDEAs. As a result, INBOX.md shows "No pending ideas" while 38 IDEA-*.md files exist in the refinement queue — a direct coordination surface failure caught by the Codex review.

### Acceptance Criteria
- [x] THINK.md Phase 1 step 3 explicitly instructs the agent to count pending IDEAs in `docs/refinement/` (excluding `archive/` and `TEMPLATE.md`) and list them in the Refinement Queue section
- [x] `docs/INBOX.md` Refinement Queue section reflects the actual count and titles of pending IDEAs
- [x] `arch review` passes
