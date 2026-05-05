## TASK-197: [BUG] DO.md Hansei protocol no longer matches enforced post-rollout close rule
**Meta:** P1 | XS | DONE | Focus:no | 6-writing | local | docs/agents/DO.md, docs/TASK-FORMAT.md, docs/tasks/TASK-195.md
**Closed-at:** 2026-05-05T11:00:00.000Z
**Depends:** none

### Context
Post-rollout runtime behavior now requires `## Hansei` on all archived tasks from `TASK-195` onward, but `DO.md` still instructs agents to write Hansei only for the old conditional triggers (size delta, blocker, or M+). The protocol now tells compliant agents to do the wrong thing.

### Acceptance Criteria
- [x] `docs/agents/DO.md` close sequence explicitly documents the post-rollout Hansei requirement for all tasks archived from `TASK-195` onward
- [x] Any remaining wording that implies Hansei is optional for post-rollout XS/S happy-path tasks is removed or clarified
- [x] Documentation stays consistent with `docs/TASK-FORMAT.md`
- [x] `arch review` passes

### Definition of Done
- [x] All ACs checked.
- [x] `arch review` passes.

## Hansei
The runtime rule had already moved; the real fix was clarifying the protocol in the exact close step and format spec instead of spreading exceptions elsewhere.
