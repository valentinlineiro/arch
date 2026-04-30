## TASK-132: Implement 'arch promote' command for easier IDEA promotion
**Meta:** P3 | S | READY | Focus:no | 2-code-generation | local | cli/, scripts/arch.sh
**Depends:** none

### Acceptance Criteria
- [ ] Add `arch promote [IDEA-slug]` command to `scripts/arch.sh`.
- [ ] Implement `PromoteCommand` in `cli/src/main/ts/application/commands/promote-command.ts`.
- [ ] The command should:
  - Validate IDEA existence.
  - Suggest the next TASK-ID.
  - Interactively (or via flag) confirm promotion.
  - Perform file movements and status updates automatically.
  - Commit the promotion with `feat: promote [IDEA-slug] to [TASK-ID]`.
- [ ] `arch review` passes.

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
