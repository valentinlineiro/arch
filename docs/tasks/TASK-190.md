## TASK-190: Implement L3 sprint autonomy (arch loop --sprint)
**Meta:** P2 | M | READY | Focus:yes | 2-code-generation | claude-code | cli/src/main/ts/application/commands/loop-command.ts, docs/agents/DO.md, docs/guidelines/
**Depends:** TASK-189

### Context
Current autonomy is L2: one task per human trigger. L3 lets the agent execute an entire sprint without per-task human intervention, stopping only on Andon Cord conditions. `arch loop` already exists; this adds sprint scoping and sprint-level governance gates. Depends on TASK-189 (executable ACs) so the autonomous loop can trust task close without an auditor per task.

### Acceptance Criteria
- [ ] `arch loop --sprint <slug>` scopes execution to tasks tagged `**Sprint:** sprint/<slug>` only; ignores all other tasks regardless of priority
- [ ] Sprint halts with an `ANDON_HALT` INBOX entry if >2 consecutive tasks in the sprint hit Andon Cord conditions
- [ ] A mid-sprint INBOX entry (`SPRINT_CHECKPOINT`) is written when 50% of sprint tasks are archived, pausing the loop for async human review before continuing
- [ ] `docs/guidelines/autonomy.md` documents L3 eligibility: `6-writing` and `7-operations` tasks are L3-eligible by default; `2-code-generation` requires explicit `L3:yes` annotation in the sprint definition
- [ ] `arch review` passes
- [ ] `npm test` passes in `cli/`

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
- [ ] `npm test` passes in `cli/`.
