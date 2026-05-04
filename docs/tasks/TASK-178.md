## TASK-178: Add Hansei section to TASK-FORMAT and DO.md close step
**Meta:** P2 | S | READY | Focus:no | 6-writing | local | docs/TASK-FORMAT.md, docs/agents/DO.md
**Depends:** none

### Context
Archived tasks capture what was done but not what could have been better. Sizing errors, blockers, and cleaner approaches found too late are lost. This is the raw material Kaizen needs but currently only exists informally in commit messages.

### Acceptance Criteria
- [ ] `TASK-FORMAT.md` documents an optional `## Hansei` section (1–3 sentences max)
- [ ] Hansei is required when: sizing delta exists, a blocker was encountered during execution, or task is M or larger
- [ ] Prompt defined in spec: *"One thing done poorly or one way this could have been cleaner."*
- [ ] DO.md close step instructs agent to check Hansei triggers and write the section before setting status to DONE

### Definition of Done
- [ ] `arch review` passes
