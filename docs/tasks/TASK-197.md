## TASK-197: [BUG] DO.md Hansei protocol no longer matches enforced post-rollout close rule
**Meta:** P1 | XS | READY | Focus:no | 6-writing | local | docs/agents/DO.md, docs/TASK-FORMAT.md, docs/tasks/TASK-195.md
**Depends:** none

### Context
Post-rollout runtime behavior now requires `## Hansei` on all archived tasks from `TASK-195` onward, but `DO.md` still instructs agents to write Hansei only for the old conditional triggers (size delta, blocker, or M+). The protocol now tells compliant agents to do the wrong thing.

### Acceptance Criteria
- [ ] `docs/agents/DO.md` close sequence explicitly documents the post-rollout Hansei requirement for all tasks archived from `TASK-195` onward
- [ ] Any remaining wording that implies Hansei is optional for post-rollout XS/S happy-path tasks is removed or clarified
- [ ] Documentation stays consistent with `docs/TASK-FORMAT.md`
- [ ] `arch review` passes

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
