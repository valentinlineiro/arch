## TASK-176: Add Sprint Open protocol to DO.md
**Meta:** P2 | XS | READY | Focus:no | 6-writing | local | docs/agents/DO.md, arch.config.json
**Depends:** none

### Context
DO.md defines a full Sprint Close sequence but has no Sprint Open protocol. Sprint naming and scoping happen ad-hoc, making sprint boundaries inconsistent and hard to trace in git history.

### Acceptance Criteria
- [ ] DO.md Intent: Operations includes a Sprint Open sequence: set `currentSprint` in arch.config.json, assign `**Sprint:**` to designated tasks, commit with `chore: open sprint/<slug> [THINK]`
- [ ] Sprint Open mirrors Sprint Close structure and is symmetrical in DO.md

### Definition of Done
- [ ] `arch review` passes
